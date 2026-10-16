import { Users, Dices, Trophy } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section className="mx-auto mt-10 grid max-w-5xl gap-3 pb-14 sm:gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
          <Users className="h-4 w-4 text-zinc-700" />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-zinc-900">2–4 Players</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Quick offline matches with friends and family.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
          <Dices className="h-4 w-4 text-zinc-700" />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-zinc-900">Fair Dice</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Clean, classic rules. Roll a 6 to bring a token out.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
          <Trophy className="h-4 w-4 text-zinc-700" />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-zinc-900">First Home Wins</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Bring all 4 tokens home before your rivals.
        </p>
      </div>
    </section>
  );
}
