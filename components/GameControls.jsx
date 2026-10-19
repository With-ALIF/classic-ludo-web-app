import Link from "next/link";
import { Dices, RotateCcw, LogOut, Volume2, VolumeX } from "lucide-react";

export default function GameControls({
  onRoll,
  rolling = false,
  disabled = false,
  hideRollOnMobile = false,
  soundOn = true,
  onToggleSound,
  onNewGame,
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
            onClick={onNewGame}
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
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sound effects" : "Unmute sound effects"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
        >
          {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {soundOn ? "Sound On" : "Sound Off"}
        </button>
      </div>
    </section>
  );
}
