import Link from "next/link";
import { Dices, RotateCcw, LogOut } from "lucide-react";

export default function GameControls({
  onRoll,
  rolling = false,
  disabled = false,
  hideRollOnMobile = false,
}) {
  return (
    <section
      aria-label="Game controls"
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-zinc-900">Controls</h2>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRoll}
          disabled={disabled || rolling}
          className={`${hideRollOnMobile ? "hidden md:inline-flex" : "inline-flex"} w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${
            disabled || rolling ? "cursor-not-allowed opacity-70" : "hover:bg-zinc-800"
          }`}
        >
          <Dices className="h-4 w-4" />
          {rolling ? "Rolling..." : "Roll Dice"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <RotateCcw className="h-4 w-4" />
            New Game
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4" />
            Exit Game
          </Link>
        </div>
      </div>
    </section>
  );
}
