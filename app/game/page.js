"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dices, Users } from "lucide-react";
import Header from "../../components/Header";
import LudoBoard from "../../components/LudoBoard";
import { LUDO_COLORS, getTokenCell, isSafeCell } from "../../components/ludo-config";
import PlayerInfo from "../../components/PlayerInfo";
import Dice from "../../components/Dice";
import GameControls from "../../components/GameControls";
import WinnerModal from "../../components/WinnerModal";
import { PLAYER_COLOR_INDEXES } from "../../components/home/constants";

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

function findVictims(tokens, moverColor, destProgress) {
  const dest = getTokenCell(moverColor, destProgress);
  if (!dest || isSafeCell(dest[0], dest[1])) return [];
  return tokens
    .filter((t) => {
      if (t.color === moverColor || t.progress < 0) return false;
      const c = getTokenCell(t.color, t.progress);
      return !!c && c[0] === dest[0] && c[1] === dest[1];
    })
    .map((t) => t.id);
}

function buildTokens(colors) {
  return colors.flatMap((color) =>
    [0, 1, 2, 3].map((index) => ({ id: `${color}-${index}`, color, index, progress: -1 }))
  );
}

function GameBoard() {
  const searchParams = useSearchParams();
  const playerCount = getPlayerCount(searchParams);
  const players = PLAYER_COLOR_INDEXES[playerCount].map((i) => ALL_PLAYERS[i]);
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
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const autoRef = useRef(null);
  const flashRef = useRef(null);
  const busyRef = useRef(false);
  const colorsKey = activeColors.join(",");
  const gameStatus = winnerIdx === null ? "playing" : "finished";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animRef.current) clearInterval(animRef.current);
      if (autoRef.current) clearTimeout(autoRef.current);
      if (flashRef.current) clearTimeout(flashRef.current);
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
    busyRef.current = false;
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
    resetGame(colorsKey.split(","));
  }, [colorsKey]);

  const handlePlayAgain = () => resetGame(activeColors);

  const handleRoll = () => {
    if (rolling || animating || gameStatus !== "playing" || busyRef.current) return;
    busyRef.current = true;
    setRolling(true);
    setSelectedId(null);
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
        showToast(`${players[currentPlayerIdx]?.colorName ?? "Player"} rolled three 6s — turn skipped!`);
        setCurrentPlayerIdx((i) => (i + 1) % players.length);
        busyRef.current = false;
        return;
      }
      const rollerColor = players[currentPlayerIdx]?.colorName.toLowerCase();
      const movers = tokens.filter(
        (t) =>
          t.color === rollerColor &&
          (t.progress === -1 ? next === 6 : t.progress !== 56 && t.progress + next <= 56)
      );
      if (movers.length === 0) {
        setDiceUsed(true);
        setSixCount(0);
        setExtraTurn(false);
        setCurrentPlayerIdx((i) => (i + 1) % players.length);
        busyRef.current = false;
      } else if (movers.length === 1) {
        setDiceUsed(false);
        autoRef.current = setTimeout(() => moveToken(movers[0], next), 650);
      } else {
        setDiceUsed(false);
        busyRef.current = false;
      }
    }, 1000);
  };

  const currentColor = players[currentPlayerIdx]?.colorName.toLowerCase();
  const movableIds =
    !diceUsed && !animating && gameStatus === "playing"
      ? tokens
          .filter((t) => {
            if (t.color !== currentColor) return false;
            if (t.progress === 56) return false;
            if (t.progress === -1) return diceValue === 6;
            return t.progress + diceValue <= 56;
          })
          .map((t) => t.id)
      : [];

  const rollDisabled =
    rolling || animating || gameStatus !== "playing" || (!diceUsed && movableIds.length > 0);

  const finishMove = (moveDice = diceValue) => {
    setSelectedId(null);
    setDiceUsed(true);
    if (moveDice !== 6) {
      setSixCount(0);
      setExtraTurn(false);
      setCurrentPlayerIdx((i) => (i + 1) % players.length);
    } else {
      setExtraTurn(true);
    }
  };

  const capName = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const showToast = (text) => {
    setCaptureFlash({ id: Date.now(), text });
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setCaptureFlash(null), 2200);
  };

  const flashCapture = (moverColor, victimIds) => {
    const victimColors = [...new Set(victimIds.map((id) => id.split("-")[0]))];
    showToast(`${capName(moverColor)} captured ${victimColors.map(capName).join(" & ")}!`);
  };

  const moveToken = (token, dice = diceValue) => {
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
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
      finishMove(dice);
      busyRef.current = false;
      return;
    }
    setAnimating(true);
    let remaining = dest - token.progress;
    animRef.current = setInterval(() => {
      remaining -= 1;
      setTokens((prev) =>
        prev.map((t) =>
          t.id === token.id ? { ...t, progress: t.progress + 1 } : t
        )
      );
      if (remaining <= 0) {
        clearInterval(animRef.current);
        animRef.current = null;
        setAnimating(false);
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
          busyRef.current = false;
        } else {
          finishMove(dice);
          busyRef.current = false;
        }
      }
    }, 200);
  };

  const handleTokenClick = (id) => {
    if (rolling || animating || diceUsed || gameStatus !== "playing" || busyRef.current) return;
    if (!movableIds.includes(id)) return;
    const token = tokens.find((t) => t.id === id);
    if (!token) return;
    busyRef.current = true;
    moveToken(token, diceValue);
  };

  const turnColor = players[currentPlayerIdx]?.colorName ?? "Player";
  let diceCaption = `${turnColor}'s Turn — roll the dice`;
  if (diceUsed && extraTurn && !rolling)
    diceCaption = `${turnColor}'s Turn — Extra Turn, roll again!`;
  if (rolling) diceCaption = "Rolling...";
  else if (animating) diceCaption = "Moving token...";
  else if (!diceUsed && movableIds.length === 0)
    diceCaption = "No valid moves — turn passes";
  else if (!diceUsed)
    diceCaption = `${turnColor}: face ${diceValue} — tap a glowing token to move`;
  if (winnerIdx !== null) diceCaption = `${turnColor} Wins!`;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="pb-6 pt-8 text-center sm:pt-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Classic Ludo
          </h1>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base">
            Standard 15&times;15 board &bull; {playerCount} players &bull; Offline
          </p>
        </section>

        <div className="grid items-start gap-5 pb-14 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            aria-label="Ludo board"
            className="relative min-w-0 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4"
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
            />
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <section
              aria-label="Players"
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
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
                    active={idx === currentPlayerIdx}
                  />
                ))}
              </div>
            </section>

            <section
              aria-label="Dice"
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Dices className="h-4 w-4" />
                Dice
              </h2>
              <div className="mt-3 flex items-center justify-center py-1">
                <Dice value={diceValue} rolling={rolling} />
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500">
                {diceCaption}
              </p>
            </section>

            <GameControls onRoll={handleRoll} rolling={rolling} disabled={rollDisabled} />
          </aside>
        </div>
      </main>

      {winnerIdx !== null && players[winnerIdx] && (
        <WinnerModal
          playerName={players[winnerIdx].name}
          colorName={players[winnerIdx].colorName}
          colorHex={players[winnerIdx].color}
          onPlayAgain={handlePlayAgain}
        />
      )}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
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
