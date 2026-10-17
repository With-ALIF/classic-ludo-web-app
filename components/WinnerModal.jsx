import Link from "next/link";
import { Trophy, RotateCcw, Home, History } from "lucide-react";

export default function WinnerModal({ playerName, colorName, colorHex, onPlayAgain }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Game over"
    >
      <div className="animate-winner-pop w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow"
          style={{ backgroundColor: colorHex }}
        >
          <Trophy className="h-6 w-6 text-white" />
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
          {playerName} Wins!
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {colorName} brought all 4 tokens home.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/history"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <History className="h-4 w-4" />
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}
