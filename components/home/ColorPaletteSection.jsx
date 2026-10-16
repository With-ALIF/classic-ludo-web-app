import { COLORS } from "./constants";

export default function ColorPaletteSection() {
  return (
    <section className="mx-auto mt-10 max-w-5xl">
      <h2 className="text-center text-lg font-semibold text-zinc-900">
        Classic Colors
      </h2>
      <p className="mt-1 text-center text-sm text-zinc-500">
        The four timeless Ludo houses.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {COLORS.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div
              className="flex h-20 items-center justify-center rounded-xl"
              style={{ backgroundColor: c.hex }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-zinc-900 shadow-sm">
                {c.name[0]}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">{c.name}</span>
              <span className="text-xs text-zinc-500">{c.hex}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
