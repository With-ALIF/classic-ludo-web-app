"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Gamepad2, Bot, Users, Globe } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/home/Footer";
import { LUDO_COLORS } from "../../components/ludo-config";
import { PLAYER_OPTIONS, COLORS, PLAYER_COLOR_INDEXES } from "../../components/home/constants";

const COLOR_NAMES = ["Red", "Green", "Yellow", "Blue"];
const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function makeRoster(count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Player ${i + 1}`,
    type: "human",
    color: COLORS[PLAYER_COLOR_INDEXES[count][i]].name,
    difficulty: "medium",
  }));
}

function initialRosterFrom(searchParams) {
  const n = parseInt(searchParams.get("players"), 10);
  const count = [2, 3, 4].includes(n) ? n : 2;
  const roster = makeRoster(count);
  const ai = parseInt(searchParams.get("ai"), 10);
  const diff = searchParams.get("difficulty");
  const difficulty = DIFFICULTIES.some((d) => d.value === diff) ? diff : "medium";
  if (!Number.isNaN(ai)) {
    for (let i = 1; i <= Math.min(ai, count - 1); i++) {
      roster[i] = {
        ...roster[i],
        type: "ai",
        name: `AI ${i + 1}`,
        difficulty,
      };
    }
  }
  return roster;
}

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("offline");
  const [playerCount, setPlayerCount] = useState(() => {
    const n = parseInt(searchParams.get("players"), 10);
    return [2, 3, 4].includes(n) ? n : 2;
  });
  const [roster, setRoster] = useState(() => initialRosterFrom(searchParams));
  const [starting, setStarting] = useState(false);

  const changeCount = (n) => {
    if (n === playerCount) return;
    setPlayerCount(n);
    setRoster((prev) => {
      const kept = prev.slice(0, n).map((p) => ({ ...p }));
      const usedColors = new Set(kept.map((p) => p.color));
      for (let i = kept.length; i < n; i++) {
        const fallbackColor =
          COLOR_NAMES.find((c) => !usedColors.has(c)) ??
          COLORS[PLAYER_COLOR_INDEXES[n][i]].name;
        kept.push({
          name: `Player ${i + 1}`,
          type: "human",
          color: fallbackColor,
          difficulty: "medium",
        });
        usedColors.add(fallbackColor);
      }
      return kept;
    });
  };

  const updatePlayer = (idx, patch) => {
    setRoster((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const toggleType = (idx, type) => {
    setRoster((prev) =>
      prev.map((p, i) => {
        if (i !== idx || p.type === type) return p;
        return {
          ...p,
          type,
          name: type === "ai" ? `AI ${idx + 1}` : `Player ${idx + 1}`,
        };
      })
    );
  };

  const errors = useMemo(() => {
    const list = [];
    if (mode !== "offline") return list;
    if (!roster.some((p) => p.type === "human")) {
      list.push("At least one human player is required in Offline mode.");
    }
    const colors = roster.map((p) => p.color);
    if (new Set(colors).size !== colors.length) {
      list.push("Each player must have a different color.");
    }
    if (roster.some((p) => p.type === "human" && !p.name.trim())) {
      list.push("Enter a name for every human player.");
    }
    return list;
  }, [mode, roster]);

  const canStart = mode === "offline" && errors.length === 0 && !starting;

  const handleStart = () => {
    if (!canStart) return;
    setStarting(true);
    const qs = new URLSearchParams();
    qs.set("players", String(playerCount));
    qs.set("mode", mode);
    qs.set(
      "roster",
      JSON.stringify(
        roster.map((p) => ({
          name: p.name.trim(),
          type: p.type,
          color: p.color,
          difficulty: p.difficulty,
        }))
      )
    );
    router.push(`/game?${qs.toString()}`);
  };

  const previewColor = (colorName) =>
    LUDO_COLORS[colorName.toLowerCase()] ?? "#a1a1aa";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-5 sm:px-6 sm:pt-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Game Setup
            </h1>
            <p className="text-sm text-zinc-500">
              Configure players, then start the match.
            </p>
          </div>
        </div>

        <section
          aria-label="Game mode"
          className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Game Mode</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("offline")}
              aria-pressed={mode === "offline"}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                mode === "offline"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <Users className="h-4 w-4" />
              Offline
            </button>
            <button
              type="button"
              onClick={() => setMode("online")}
              aria-pressed={mode === "online"}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                mode === "online"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <Globe className="h-4 w-4" />
              Online
            </button>
          </div>
          {mode === "online" && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Online multiplayer needs a server backend — coming soon. Only
              Offline is playable right now.
            </p>
          )}
        </section>

        <section
          aria-label="Number of players"
          className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-sm font-semibold text-zinc-900">Players</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {PLAYER_OPTIONS.map((opt) => {
              const active = playerCount === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => changeCount(opt.value)}
                  aria-pressed={active}
                  className={`rounded-xl border p-3 text-center transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      active ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {opt.value}
                  </div>
                  <div className="mt-1.5 text-xs font-semibold sm:text-sm">
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {mode === "offline" && (
          <section
            aria-label="Players and colors"
            className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="text-sm font-semibold text-zinc-900">
              Players &amp; Colors
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {roster.map((p, idx) => {
                const takenColors = new Set(
                  roster.filter((_, i) => i !== idx).map((x) => x.color)
                );
                const isAi = p.type === "ai";
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: previewColor(p.color) }}
                        aria-hidden="true"
                      >
                        {idx + 1}
                      </span>
                      {isAi ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Bot className="h-4 w-4 shrink-0 text-zinc-500" />
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {p.name}
                          </p>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={p.name}
                          maxLength={16}
                          onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                          aria-label={`Name for player ${idx + 1}`}
                          placeholder={`Player ${idx + 1}`}
                          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900"
                        />
                      )}
                      <div className="flex shrink-0 gap-1">
                        {["human", "ai"].map((t) => {
                          const active = p.type === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleType(idx, t)}
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                active
                                  ? "border-zinc-900 bg-zinc-900 text-white"
                                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                              }`}
                            >
                              {t === "human" ? "Human" : "AI"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {isAi && (
                      <div className="mt-2 flex items-center gap-2 pl-9">
                        <span className="text-xs font-medium text-zinc-500">
                          Difficulty
                        </span>
                        <div className="flex gap-1.5">
                          {DIFFICULTIES.map((d) => {
                            const active = p.difficulty === d.value;
                            return (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() => updatePlayer(idx, { difficulty: d.value })}
                                aria-pressed={active}
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                                  active
                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                    : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2 pl-9">
                      <span className="text-xs font-medium text-zinc-500">Color</span>
                      <div className="flex gap-2">
                        {COLOR_NAMES.map((c) => {
                          const active = p.color === c;
                          const disabled = takenColors.has(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              disabled={disabled}
                              onClick={() => updatePlayer(idx, { color: c })}
                              aria-label={`${c}${disabled ? " (taken)" : ""}`}
                              aria-pressed={active}
                              title={disabled ? `${c} is taken` : c}
                              className={`h-7 w-7 rounded-full border-2 transition ${
                                active
                                  ? "border-zinc-900 scale-110"
                                  : "border-white shadow"
                              } ${disabled ? "cursor-not-allowed opacity-30" : "hover:scale-105"}`}
                              style={{
                                backgroundColor:
                                  LUDO_COLORS[c.toLowerCase()],
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-zinc-100 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Match Preview
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {roster.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: previewColor(p.color) }}
                      aria-hidden="true"
                    />
                    <span className="max-w-[9rem] truncate">{p.name}</span>
                    <span className="text-zinc-400">
                      #{idx + 1} &middot; {p.color}
                      {p.type === "ai" ? ` \u00b7 ${p.difficulty}` : " \u00b7 Human"}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {errors.length > 0 && (
          <ul className="mt-4 space-y-1">
            {errors.map((e) => (
              <li
                key={e}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              >
                {e}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm ${
              canStart ? "hover:bg-zinc-800" : "cursor-not-allowed opacity-60"
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            {starting ? "Starting..." : "Start Game"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50">
          <Header />
          <main className="mx-auto w-full max-w-3xl px-4 py-10 text-center text-sm text-zinc-500 sm:px-6">
            Loading setup...
          </main>
        </div>
      }
    >
      <SetupForm />
    </Suspense>
  );
}
