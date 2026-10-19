"use client";

import { useEffect } from "react";
import Link from "next/link";
import { User, Gamepad2, Bot } from "lucide-react";
import { PLAYER_OPTIONS, COLORS, PLAYER_COLOR_INDEXES } from "./constants";
import { loadSettings } from "../../lib/settings";

const AI_DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function SetupCard({
  playerCount,
  setPlayerCount,
  aiCount,
  setAiCount,
  difficulty,
  setDifficulty,
}) {
  const maxAi = playerCount - 1;
  const selectedAi = Math.min(aiCount, maxAi);

  useEffect(() => {
    const s = loadSettings();
    setPlayerCount(s.general.players);
    setAiCount(s.general.opponent === "local" ? 0 : Math.min(1, s.general.players - 1));
    setDifficulty(s.general.difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const aiOptions = [0, 1, 2, 3].filter((n) => n <= maxAi);
  const aiGridClass =
    aiOptions.length === 2
      ? "grid-cols-2"
      : aiOptions.length === 3
      ? "grid-cols-3"
      : "grid-cols-4";
  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Choose Players</h2>
            <p className="mt-1 text-sm text-zinc-500">Select 2, 3 or 4 players to start a match.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 sm:inline-flex">
            <User className="h-3.5 w-3.5" />
            {playerCount}P selected
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {PLAYER_OPTIONS.map((opt) => {
            const active = playerCount === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlayerCount(opt.value)}
                aria-pressed={active}
                className={`rounded-xl border p-4 text-center transition ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-base font-bold ${
                    active ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {opt.value}
                </div>
                <div className="mt-2 text-sm font-semibold">{opt.label}</div>
                <div className={`mt-1 hidden text-xs sm:block ${active ? "text-zinc-300" : "text-zinc-500"}`}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Opponents</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                Play against the AI or friends on one screen.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              <Bot className="h-3.5 w-3.5" />
              {selectedAi === 0 ? "Local" : `${selectedAi} AI`}
            </span>
          </div>
          <div className={`mt-3 grid gap-2 ${aiGridClass}`}>
            {aiOptions.map((n) => {
              const active = selectedAi === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAiCount(n)}
                  aria-pressed={active}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {n === 0 ? "Local" : `${n} AI`}
                </button>
              );
            })}
          </div>
          {selectedAi > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500">Difficulty</span>
              <div className="flex gap-2">
                {AI_DIFFICULTY_OPTIONS.map((d) => {
                  const active = difficulty === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDifficulty(d.value)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 border-t border-zinc-100 pt-6">
          {PLAYER_COLOR_INDEXES[playerCount].map((i) => {
            const c = COLORS[i];
            return (
              <span key={c.name} className="flex items-center gap-2">
                <span className="inline-block h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                <span className="text-xs font-medium text-zinc-600">{c.name}</span>
              </span>
            );
          })}
        </div>

        <Link
          href={`/setup?players=${playerCount}&ai=${selectedAi}&difficulty=${difficulty}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          <Gamepad2 className="h-4 w-4" />
          Set Up {playerCount}-Player Game
        </Link>
        <p className="mt-3 text-center text-xs text-zinc-400">
          Choose players, colors and AI opponents on the next screen.
        </p>
      </div>
    </section>
  );
}
