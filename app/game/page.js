"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dices, RotateCcw, Settings as SettingsIcon, Users, Volume2, VolumeX } from "lucide-react";
import Header from "../../components/Header";
import LudoBoard from "../../components/LudoBoard";
import { LUDO_COLORS, findVictims, canTokenMove, getMovableTokens } from "../../components/ludo-config";
import PlayerInfo from "../../components/PlayerInfo";
import Dice from "../../components/Dice";
import GameControls from "../../components/GameControls";
import WinnerModal from "../../components/WinnerModal";
import { PLAYER_COLOR_INDEXES } from "../../components/home/constants";
import { chooseAiMove, AI_DIFFICULTIES } from "../../lib/ai-opponent";
import { buildMatchRecord, createMatchId, saveMatch } from "../../lib/game-history";
import { sfx, unlockAudio, setMuted as setSfxMuted, setChannels as setSfxChannels } from "../../lib/sfx";
import { loadActiveGame, saveActiveGame, clearActiveGame } from "../../lib/active-game";
import { loadSettings, updateSettings, defaultSettings, SETTINGS_KEY, THEMES } from "../../lib/settings";
import ConfirmDialog from "../../components/ConfirmDialog";

const ALL_PLAYERS = [
  { name: "Player 1", colorName: "Red", color: LUDO_COLORS.red },
  { name: "Player 2", colorName: "Green", color: LUDO_COLORS.green },
  { name: "Player 3", colorName: "Yellow", color: LUDO_COLORS.yellow },
  { name: "Player 4", colorName: "Blue", color: LUDO_COLORS.blue },
];

function getPlayerCount(searchParams) {
  const n = parseInt(searchParams.get("players"), 10);
  return [2, 3, 4].includes(n) ? n : 4;
}

function getAiCount(searchParams, playerCount) {
  const n = parseInt(searchParams.get("ai"), 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(n, playerCount - 1));
}

function getDifficulty(searchParams) {
  const d = searchParams.get("difficulty");
  return AI_DIFFICULTIES.includes(d) ? d : "medium";
}

function getMode(searchParams) {
  const m = searchParams.get("mode");
  return m === "online" ? "online" : "offline";
}

const ROSTER_COLORS = ["Red", "Green", "Yellow", "Blue"];

function parseRoster(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 2 || parsed.length > 4) return null;
    const colors = parsed.map((p) => p?.color);
    if (!colors.every((c) => ROSTER_COLORS.includes(c))) return null;
    if (new Set(colors).size !== colors.length) return null;
    const players = parsed.map((p, i) => {
      const isAi = p?.type === "ai";
      return {
        name:
          typeof p?.name === "string" && p.name.trim()
            ? p.name.trim().slice(0, 16)
            : isAi
            ? `AI ${i + 1}`
            : `Player ${i + 1}`,
        colorName: p.color,
        color: LUDO_COLORS[p.color.toLowerCase()],
        isAi,
        difficulty: isAi && AI_DIFFICULTIES.includes(p?.difficulty) ? p.difficulty : "medium",
      };
    });
    if (!players.some((p) => !p.isAi)) return null;
    return players;
  } catch {
    return null;
  }
}

function buildTokens(colors) {
  return colors.flatMap((color) =>
    [0, 1, 2, 3].map((index) => ({ id: `${color}-${index}`, color, index, progress: -1 }))
  );
}

function GameBoard() {
  const searchParams = useSearchParams();
  const playerCount = getPlayerCount(searchParams);
  const aiCount = getAiCount(searchParams, playerCount);
  const difficulty = getDifficulty(searchParams);
  const mode = getMode(searchParams);
  const rosterRaw = searchParams.get("roster");
  const rosterPlayers = parseRoster(rosterRaw);
  const [settings, setSettings] = useState(defaultSettings);
  const palette = THEMES[settings.appearance.theme]?.colors ?? LUDO_COLORS;
  const tokenAnimOn =
    settings.appearance.animations &&
    settings.appearance.tokenAnimation &&
    !settings.appearance.reducedMotion;
  const diceAnimOn =
    settings.appearance.animations &&
    settings.appearance.diceAnimation &&
    !settings.appearance.reducedMotion;
  const basePlayers =
    rosterPlayers ??
    PLAYER_COLOR_INDEXES[playerCount].map((i, idx) => ({
      ...ALL_PLAYERS[i],
      isAi: aiCount > 0 && idx >= 1 && idx <= aiCount,
      difficulty,
    }));
  const players = basePlayers.map((p) => ({
    ...p,
    color: palette[p.colorName.toLowerCase()] ?? p.color,
  }));
  const activeColors = players.map((p) => p.colorName.toLowerCase());
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [tokens, setTokens] = useState(() => buildTokens(activeColors));
  const [selectedId, setSelectedId] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [diceUsed, setDiceUsed] = useState(true);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [sixCount, setSixCount] = useState(0);
  const [extraTurn, setExtraTurn] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [captureFlash, setCaptureFlash] = useState(null);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const autoRef = useRef(null);
  const flashRef = useRef(null);
  const busyRef = useRef(false);
  const aiTimerRef = useRef(null);
  const matchIdRef = useRef(null);
  const matchStartedAtRef = useRef(null);
  const matchRecordedRef = useRef(false);
  const activeSigRef = useRef(null);
  const colorsKey = activeColors.join(",");
  const gameStatus = winnerIdx === null ? "playing" : "finished";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animRef.current) clearInterval(animRef.current);
      if (autoRef.current) clearTimeout(autoRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const resetGame = (colors) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    if (flashRef.current) {
      clearTimeout(flashRef.current);
      flashRef.current = null;
    }
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    busyRef.current = false;
    matchIdRef.current = createMatchId();
    matchStartedAtRef.current = Date.now();
    matchRecordedRef.current = false;
    setTokens(buildTokens(colors));
    setSelectedId(null);
    setCurrentPlayerIdx(0);
    setSixCount(0);
    setExtraTurn(false);
    setWinnerIdx(null);
    setCaptureFlash(null);
    setAnimating(false);
    setDiceUsed(true);
    setDiceValue(1);
    setRolling(false);
  };

  useEffect(() => {
    const sig = `${colorsKey}|${rosterRaw ?? ""}`;
    if (activeSigRef.current === sig) return;
    activeSigRef.current = sig;
    const saved = loadActiveGame({ colorsKey, rosterRaw });
    if (saved) {
      setTokens(saved.tokens);
      setCurrentPlayerIdx(saved.currentPlayerIdx);
      setDiceValue(typeof saved.diceValue === "number" ? saved.diceValue : 1);
      setDiceUsed(saved.diceUsed !== false);
      setSixCount(saved.sixCount ?? 0);
      setExtraTurn(!!saved.extraTurn);
      setWinnerIdx(saved.winnerIdx ?? null);
      setRolling(false);
      setAnimating(false);
      setSelectedId(null);
      setCaptureFlash(null);
      matchIdRef.current = saved.matchId ?? null;
      matchStartedAtRef.current = saved.matchStartedAt ?? null;
      matchRecordedRef.current = !!saved.matchRecorded;
      return;
    }
    clearActiveGame();
    resetGame(colorsKey.split(","));
  }, [colorsKey, rosterRaw]);

  useEffect(() => {
    if (animating || rolling) return;
    saveActiveGame({
      colorsKey,
      rosterRaw,
      tokens,
      currentPlayerIdx,
      diceValue,
      diceUsed,
      sixCount,
      extraTurn,
      winnerIdx,
      matchId: matchIdRef.current,
      matchStartedAt: matchStartedAtRef.current,
      matchRecorded: matchRecordedRef.current,
    });
  }, [
    colorsKey,
    rosterRaw,
    tokens,
    currentPlayerIdx,
    diceValue,
    diceUsed,
    sixCount,
    extraTurn,
    winnerIdx,
    animating,
    rolling,
  ]);

  const handlePlayAgain = () => resetGame(activeColors);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    setSettings(loadSettings());
    const onStorage = (e) => {
      if (e.key === SETTINGS_KEY) setSettings(loadSettings());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setSfxMuted(!settings.sound.effects);
    setSfxChannels({
      dice: settings.sound.dice,
      movement: settings.sound.movement,
      capture: settings.sound.capture,
      victory: settings.sound.victory,
    });
  }, [settings.sound]);

  useEffect(() => {
    if (!settings.gameplay.confirmLeave) return;
    if (winnerIdx !== null) return;
    if (!tokens.some((t) => t.progress >= 0)) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [settings.gameplay.confirmLeave, tokens, winnerIdx]);

  const handleToggleSound = () => {
    setSettings(updateSettings({ sound: { effects: !settings.sound.effects } }));
    unlockAudio();
  };

  const handleNewGame = () => {
    if (settings.general.confirmRestart) {
      setConfirmNewGame(true);
    } else {
      handlePlayAgain();
    }
  };

  const handleRoll = () => {
    if (rolling || animating || gameStatus !== "playing" || !diceUsed || busyRef.current) return;
    busyRef.current = true;
    setRolling(true);
    setSelectedId(null);
    sfx.roll();
    timerRef.current = setTimeout(() => {
      let next = Math.floor(Math.random() * 6) + 1;
      while (next === diceValue) {
        next = Math.floor(Math.random() * 6) + 1;
      }
      setDiceValue(next);
      const newSixCount = next === 6 ? sixCount + 1 : 0;
      setSixCount(newSixCount);
      setRolling(false);
      if (newSixCount >= 3) {
        setSixCount(0);
        setDiceUsed(true);
        setExtraTurn(false);
        sfx.fail();
        showToast(`${players[currentPlayerIdx]?.colorName ?? "Player"} rolled three 6s — turn skipped!`);
        setCurrentPlayerIdx((i) => (i + 1) % players.length);
        busyRef.current = false;
        return;
      }
      const rollerColor = players[currentPlayerIdx]?.colorName.toLowerCase();
      const movers = getMovableTokens(tokens, rollerColor, next);
      if (movers.length === 0) {
        setDiceUsed(true);
        setSixCount(0);
        setExtraTurn(false);
        sfx.pass();
        setCurrentPlayerIdx((i) => (i + 1) % players.length);
        busyRef.current = false;
      } else if (movers.length === 1) {
        setDiceUsed(false);
        busyRef.current = true;
        autoRef.current = setTimeout(() => moveToken(movers[0], next), 650);
      } else {
        setDiceUsed(false);
        busyRef.current = false;
      }
    }, 1000);
  };

  const currentColor = players[currentPlayerIdx]?.colorName.toLowerCase();
  const isAiSlot = (idx) => !!players[idx]?.isAi;
  const currentIsAi = isAiSlot(currentPlayerIdx);
  const currentDifficulty = players[currentPlayerIdx]?.difficulty ?? "medium";
  const movableIds =
    !diceUsed && !animating && gameStatus === "playing"
      ? getMovableTokens(tokens, currentColor, diceValue).map((t) => t.id)
      : [];

  const rollDisabled =
    rolling ||
    animating ||
    gameStatus !== "playing" ||
    currentIsAi ||
    (!diceUsed && movableIds.length > 0);

  const finishMove = (moveDice = diceValue, captureBonus = false) => {
    setSelectedId(null);
    setDiceUsed(true);
    if (moveDice === 6 || captureBonus) {
      setExtraTurn(true);
    } else {
      setExtraTurn(false);
      setCurrentPlayerIdx((i) => (i + 1) % players.length);
    }
    if (moveDice !== 6) setSixCount(0);
  };

  const capName = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const showToast = (text) => {
    setCaptureFlash({ id: Date.now(), text });
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setCaptureFlash(null), 2200);
  };

  const flashCapture = (moverColor, victimIds) => {
    sfx.capture();
    const victimColors = [...new Set(victimIds.map((id) => id.split("-")[0]))];
    showToast(
      `${capName(moverColor)} captured ${victimColors.map(capName).join(" & ")}! Bonus roll!`
    );
  };

  const recordMatch = (winnerIdxFound) => {
    if (matchRecordedRef.current) return;
    matchRecordedRef.current = true;
    try {
      const participants = players.map((p) => ({
        name: p.name,
        color: p.colorName,
        isAi: !!p.isAi,
        difficulty: p.isAi ? p.difficulty ?? "medium" : undefined,
      }));
      const record = buildMatchRecord({
        id: matchIdRef.current ?? createMatchId(),
        mode,
        players: participants,
        winnerIndex: winnerIdxFound,
        startedAt: matchStartedAtRef.current ?? Date.now(),
        endedAt: Date.now(),
      });
      const saved = saveMatch(record);
      if (saved.ok) showToast("Match saved to history");
      else if (saved.error !== "duplicate") showToast("Couldn't save match to history");
    } catch {
      showToast("Couldn't save match to history");
    }
  };

  const moveToken = (token, dice = diceValue) => {
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    if (gameStatus !== "playing" || !canTokenMove(token, dice)) {
      busyRef.current = false;
      return;
    }
    const dest = token.progress === -1 ? 0 : token.progress + dice;
    setSelectedId(token.id);
    if (token.progress === -1) {
      const victims = findVictims(tokens, token.color, 0);
      setTokens((prev) =>
        prev.map((t) => {
          if (t.id === token.id) return { ...t, progress: 0 };
          if (victims.includes(t.id)) return { ...t, progress: -1 };
          return t;
        })
      );
      if (victims.length > 0) flashCapture(token.color, victims);
      else sfx.exitBase();
      finishMove(dice, victims.length > 0);
      busyRef.current = false;
      return;
    }
    const landResult = () => {
      const after = tokens.map((t) =>
        t.id === token.id ? { ...t, progress: dest } : t
      );
      const victims = findVictims(after, token.color, dest);
      const finalTokens =
        victims.length > 0
          ? after.map((t) => (victims.includes(t.id) ? { ...t, progress: -1 } : t))
          : after;
      setTokens(finalTokens);
      if (victims.length > 0) flashCapture(token.color, victims);
      const finishedCount = finalTokens.filter(
        (t) => t.color === token.color && t.progress === 56
      ).length;
      if (finishedCount === 4) {
        const wIdx = players.findIndex(
          (p) => p.colorName.toLowerCase() === token.color
        );
        setWinnerIdx(wIdx);
        setSelectedId(null);
        setDiceUsed(true);
        setSixCount(0);
        setExtraTurn(false);
        busyRef.current = false;
        sfx.win();
        recordMatch(wIdx);
        return;
      }
      if (victims.length === 0) {
        if (dest === 56) sfx.home();
        else sfx.land();
      }
      finishMove(dice, victims.length > 0);
      busyRef.current = false;
    };

    if (!tokenAnimOn) {
      landResult();
      return;
    }
    setAnimating(true);
    let remaining = dest - token.progress;
    animRef.current = setInterval(() => {
      remaining -= 1;
      sfx.step();
      setTokens((prev) =>
        prev.map((t) =>
          t.id === token.id ? { ...t, progress: t.progress + 1 } : t
        )
      );
      if (remaining <= 0) {
        clearInterval(animRef.current);
        animRef.current = null;
        setAnimating(false);
        landResult();
      }
    }, 200);
  };

  const handleTokenClick = (id) => {
    if (rolling || animating || diceUsed || gameStatus !== "playing" || busyRef.current) return;
    if (currentIsAi) return;
    if (!movableIds.includes(id)) return;
    const token = tokens.find((t) => t.id === id);
    if (!token || !canTokenMove(token, diceValue)) return;
    busyRef.current = true;
    sfx.select();
    moveToken(token, diceValue);
  };

  useEffect(() => {
    if (!currentIsAi || gameStatus !== "playing") return;
    if (rolling || animating || !diceUsed || busyRef.current) return;
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      if (busyRef.current || rolling || animating || !diceUsed) return;
      handleRoll();
    }, 900);
    return () => {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    };
  }, [currentIsAi, gameStatus, rolling, animating, diceUsed, currentPlayerIdx]);

  useEffect(() => {
    if (!currentIsAi || gameStatus !== "playing") return;
    if (rolling || animating || diceUsed || busyRef.current) return;
    if (autoRef.current) return;
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      if (busyRef.current || rolling || animating || diceUsed) return;
      const chosen = chooseAiMove({
        tokens,
        movableIds,
        dice: diceValue,
        difficulty: currentDifficulty,
      });
      if (!chosen) {
        setDiceUsed(true);
        setSixCount(0);
        setExtraTurn(false);
        setCurrentPlayerIdx((i) => (i + 1) % players.length);
        return;
      }
      busyRef.current = true;
      moveToken(chosen, diceValue);
    }, 750);
    return () => {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    };
  }, [currentIsAi, gameStatus, rolling, animating, diceUsed, currentPlayerIdx, diceValue, movableIds.join(","), tokens, currentDifficulty]);

  const turnColor = players[currentPlayerIdx]?.colorName ?? "Player";
  let diceCaption = `${turnColor}'s Turn — roll the dice`;
  if (diceUsed && extraTurn && !rolling)
    diceCaption = `${turnColor}'s Turn — Extra Turn, roll again!`;
  if (rolling) diceCaption = "Rolling...";
  else if (animating) diceCaption = "Moving token...";
  else if (!diceUsed && movableIds.length === 0)
    diceCaption = "No valid moves — turn passes";
  else if (!diceUsed)
    diceCaption = settings.gameplay.moveHints
      ? `${turnColor}: face ${diceValue} — tap a glowing token to move`
      : `${turnColor}: face ${diceValue}`;
  if (currentIsAi && winnerIdx === null) {
    if (rolling) diceCaption = "AI is rolling...";
    else if (animating) diceCaption = "AI is moving token...";
    else diceCaption = "AI is thinking...";
  }
  if (winnerIdx !== null) diceCaption = `${turnColor} Wins!`;

  return (
    <div
      data-motion={
        settings.appearance.animations && !settings.appearance.reducedMotion ? "on" : "off"
      }
      className="min-h-screen min-h-[100dvh] select-none touch-action-manipulation overflow-x-hidden bg-neutral-50"
    >
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="pb-3 pt-3 text-center sm:pb-6 sm:pt-10">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Classic Ludo
          </h1>
          <p className="mt-1 text-xs text-zinc-600 sm:mt-2 sm:text-base">
            Standard 15&times;15 board &bull; {playerCount} players &bull;{" "}
            {mode === "online" ? "Online" : "Offline"}
          </p>
        </section>

        <div className="grid items-start gap-4 pb-48 md:pb-14 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            aria-label="Ludo board"
            className="relative mx-auto w-full min-w-0 max-w-[min(100%,calc(100dvh-15rem))] rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm sm:p-4 md:max-w-[min(100%,calc(100dvh-8rem))]"
          >
            {captureFlash && (
              <div
                key={captureFlash.id}
                className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white shadow-lg"
              >
                {captureFlash.text}
              </div>
            )}
            <LudoBoard
              tokens={tokens}
              movableIds={movableIds}
              selectedId={selectedId}
              onTokenClick={handleTokenClick}
              colors={palette}
              highlight={settings.gameplay.highlightMoves}
            />
          </section>

          <section
            aria-label="Turn controls"
            className="order-first flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:hidden"
          >
            {settings.gameplay.playerIndicator && (
              <span
                className="h-9 w-9 shrink-0 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: players[currentPlayerIdx]?.color }}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {players[currentPlayerIdx]?.name}
                <span className="font-normal text-zinc-400"> &middot; </span>
                <span style={{ color: players[currentPlayerIdx]?.color }}>
                  {turnColor}
                </span>
              </p>
              <p className="truncate text-xs text-zinc-500">{diceCaption}</p>
            </div>
            <button
              type="button"
              onClick={handleRoll}
              disabled={rollDisabled}
              className={`inline-flex shrink-0 touch-action-manipulation items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm ${
                rollDisabled ? "cursor-not-allowed opacity-70" : "hover:bg-zinc-800"
              }`}
            >
              <Dices className="h-4 w-4" />
              {rolling ? "Rolling..." : "Roll Dice"}
            </button>
          </section>

          <section
            aria-label="Players (compact)"
            className="grid grid-cols-4 gap-2 md:hidden"
          >
            {players.map((p, idx) => {
              const color = p.colorName.toLowerCase();
              const home = tokens.filter(
                (t) => t.color === color && t.progress === 56
              ).length;
              const active = settings.gameplay.playerIndicator && idx === currentPlayerIdx;
              return (
                <div
                  key={p.colorName}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 ${
                    active
                      ? "border-zinc-900 bg-white shadow-sm"
                      : "border-zinc-200 bg-white/60"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                    aria-hidden="true"
                  />
                  <span className="w-full truncate text-center text-[10px] font-semibold text-zinc-800">
                    {p.name}
                  </span>
                  <span className="text-[10px] tabular-nums text-zinc-500">
                    {isAiSlot(idx) ? "AI · " : ""}
                    {4 - home} left
                  </span>
                </div>
              );
            })}
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <section
              aria-label="Players"
              className="hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:block"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Users className="h-4 w-4" />
                Players
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {players.map((p, idx) => (
                  <PlayerInfo
                    key={p.colorName}
                    name={p.name}
                    colorName={p.colorName}
                    color={p.color}
                    tokensInBase={
                      tokens.filter(
                        (t) => t.color === p.colorName.toLowerCase() && t.progress === -1
                      ).length
                    }
                    tokensHome={0}
                    active={settings.gameplay.playerIndicator && idx === currentPlayerIdx}
                    ai={isAiSlot(idx)}
                  />
                ))}
              </div>
            </section>

            <section
              aria-label="Dice"
              className="hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:block"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Dices className="h-4 w-4" />
                Dice
              </h2>
              <div className="mt-3 flex items-center justify-center py-1">
                <Dice value={diceValue} rolling={rolling && diceAnimOn} />
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500">
                {diceCaption}
              </p>
            </section>

            <GameControls
              onRoll={handleRoll}
              rolling={rolling}
              disabled={rollDisabled}
              hideRollOnMobile
              soundOn={settings.sound.effects}
              onToggleSound={handleToggleSound}
              onNewGame={handleNewGame}
            />
          </aside>
        </div>
      </main>

      <div
        aria-label="Game controls (mobile)"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.1)] backdrop-blur md:hidden"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <Dice
            value={diceValue}
            rolling={rolling && diceAnimOn}
            className="h-11 w-11 shrink-0 rounded-xl"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-zinc-600">
            {diceCaption}
          </p>
          <button
            type="button"
            onClick={handleRoll}
            disabled={rollDisabled}
            className={`inline-flex shrink-0 touch-action-manipulation items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${
              rollDisabled ? "cursor-not-allowed opacity-70" : "hover:bg-zinc-800"
            }`}
          >
            <Dices className="h-4 w-4" />
            {rolling ? "Rolling..." : "Roll Dice"}
          </button>
        </div>
        <div className="mt-2 flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleNewGame}
            className="inline-flex flex-1 touch-action-manipulation items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            New Game
          </button>
          <button
            type="button"
            onClick={handleToggleSound}
            aria-pressed={settings.sound.effects}
            aria-label={settings.sound.effects ? "Mute sound effects" : "Unmute sound effects"}
            className="inline-flex flex-1 touch-action-manipulation items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            {settings.sound.effects ? (
              <Volume2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 shrink-0" />
            )}
            {settings.sound.effects ? "Sound On" : "Sound Off"}
          </button>
          <Link
            href="/settings"
            className="inline-flex flex-1 touch-action-manipulation items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            <SettingsIcon className="h-3.5 w-3.5 shrink-0" />
            Settings
          </Link>
        </div>
      </div>

      {winnerIdx !== null && players[winnerIdx] && (
        <WinnerModal
          playerName={players[winnerIdx].name}
          colorName={players[winnerIdx].colorName}
          colorHex={players[winnerIdx].color}
          onPlayAgain={handlePlayAgain}
        />
      )}
      <ConfirmDialog
        open={confirmNewGame}
        title="Restart game?"
        message="All tokens return to their base and a new match begins. Current progress on this match will be lost."
        confirmLabel="Restart"
        destructive
        onConfirm={() => {
          setConfirmNewGame(false);
          handlePlayAgain();
        }}
        onCancel={() => setConfirmNewGame(false)}
      />
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 pb-44 pt-5 text-xs text-zinc-500 sm:flex-row sm:px-6 sm:pb-5 lg:px-8">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
            <Dices className="h-4 w-4" /> LudoVerse
          </span>
          <span>Classic Ludo &bull; Board UI only</span>
        </div>
      </footer>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50">
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-10 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
            Loading board...
          </main>
        </div>
      }
    >
      <GameBoard />
    </Suspense>
  );
}
