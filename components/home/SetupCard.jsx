"use client";

import Link from "next/link";
import { User, Gamepad2 } from "lucide-react";
import { PLAYER_OPTIONS, COLORS, PLAYER_COLOR_INDEXES } from "./constants";

export default function SetupCard({ playerCount, setPlayerCount }) {
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
          href={`/game?players=${playerCount}`}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          <Gamepad2 className="h-4 w-4" />
          Start {playerCount}-Player Game
        </Link>
        <p className="mt-3 text-center text-xs text-zinc-400">
          Board & game logic will be added in the next step.
        </p>
      </div>
    </section>
  );
}
