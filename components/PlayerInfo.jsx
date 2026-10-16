export default function PlayerInfo({
  name,
  color,
  tokensInBase = 4,
  active = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 ${
        active ? "border-zinc-900 shadow-sm" : "border-zinc-200"
      }`}
    >
      <span
        className="h-9 w-9 shrink-0 rounded-full border-2 border-white shadow"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
          {active && (
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Active
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border border-black/10"
            style={{ backgroundColor: i < tokensInBase ? color : "#e4e4e7" }}
          />
        ))}
      </div>
    </div>
  );
}
