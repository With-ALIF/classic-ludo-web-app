"use client";

import { Dices, Users, Globe } from "lucide-react";

export default function HeroSection({ mode, setMode }) {
  return (
    <section className="pb-10 pt-10 text-center sm:pt-16">
      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
        <Dices className="h-3.5 w-3.5" />
        Classic Board Game
      </span>

      <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
        Classic Ludo
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600 sm:text-lg">
        Roll the dice. Bring your tokens home.
      </p>

      <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => setMode("offline")}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition ${
            mode === "offline"
              ? "bg-zinc-900 text-white hover:bg-zinc-800"
              : "border border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400"
          }`}
        >
          <Users className="h-4 w-4" />
          Play Offline
        </button>
        <button
          type="button"
          onClick={() => setMode("online")}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition ${
            mode === "online"
              ? "bg-zinc-900 text-white hover:bg-zinc-800"
              : "border border-zinc-300 bg-white text-zinc-800 hover:border-zinc-400"
          }`}
        >
          <Globe className="h-4 w-4" />
          Play Online
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        {mode === "offline"
          ? "Pass-and-play on this device. No login needed."
          : "Online lobby coming soon — UI preview only."}
      </p>
    </section>
  );
}
