import LudoCell from "./LudoCell";
import LudoToken from "./LudoToken";
import { LUDO_COLORS, START_CELLS, STAR_CELLS, getTokenCell } from "./ludo-config";

const HOME_LANES = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 9], [7, 10], [7, 11], [7, 12], [7, 13]],
  blue: [[9, 7], [10, 7], [11, 7], [12, 7], [13, 7]],
};

const LANE_MAP = {};
Object.entries(HOME_LANES).forEach(([color, cells]) => {
  cells.forEach(([r, c]) => {
    LANE_MAP[`${r},${c}`] = color;
  });
});

const QUADRANTS = [
  { color: "red", gridRow: "1 / 7", gridColumn: "1 / 7" },
  { color: "green", gridRow: "1 / 7", gridColumn: "10 / 16" },
  { color: "yellow", gridRow: "10 / 16", gridColumn: "10 / 16" },
  { color: "blue", gridRow: "10 / 16", gridColumn: "1 / 7" },
];

function isArmCell(r, c) {
  const inLeft = r >= 6 && r <= 8 && c >= 0 && c <= 5;
  const inTop = r >= 0 && r <= 5 && c >= 6 && c <= 8;
  const inRight = r >= 6 && r <= 8 && c >= 9 && c <= 14;
  const inBottom = r >= 9 && r <= 14 && c >= 6 && c <= 8;
  return inLeft || inTop || inRight || inBottom;
}

function armCells() {
  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (isArmCell(r, c)) cells.push([r, c]);
    }
  }
  return cells;
}

function HomeBase({ color, gridRow, gridColumn, tokens, movableIds, selectedId, onTokenClick }) {
  const hex = LUDO_COLORS[color];
  const nests = [0, 1, 2, 3].map(
    (i) => tokens.find((t) => t.color === color && t.index === i && t.progress === -1) ?? null
  );
  return (
    <div
      className="flex items-center justify-center ring-1 ring-inset ring-zinc-800/20"
      style={{ gridRow, gridColumn, backgroundColor: hex }}
    >
      <div className="h-[70%] w-[70%] rounded-lg bg-white p-[6%] shadow-sm">
        <div className="grid h-full w-full grid-cols-2 grid-rows-2">
          {nests.map((token, i) => {
            const movable = !!token && movableIds.includes(token.id);
            const selected = !!token && selectedId === token.id;
            return (
              <div key={i} className="p-[9%]">
                <button
                  type="button"
                  disabled={!movable}
                  onClick={() => token && onTokenClick?.(token.id)}
                  aria-label={
                    token ? `${color} token ${i + 1}${movable ? ", movable" : ""}` : `Empty ${color} nest`
                  }
                  className={`flex h-full w-full items-center justify-center rounded-full border-2 ${
                    movable ? "cursor-pointer" : "cursor-default"
                  }`}
                  style={{ borderColor: hex, backgroundColor: `${hex}4D` }}
                >
                  {token && (
                    <LudoToken
                      color={hex}
                      title={`${color} token ${i + 1}`}
                      movable={movable}
                      selected={selected}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FinishHome() {
  return (
    <div
      className="relative overflow-hidden bg-white ring-1 ring-inset ring-zinc-300"
      style={{ gridRow: "7 / 10", gridColumn: "7 / 10" }}
      aria-label="Finishing area"
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: LUDO_COLORS.red,
          clipPath: "polygon(0 0, 0 100%, 50% 50%)",
        }}
      />
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: LUDO_COLORS.green,
          clipPath: "polygon(0 0, 100% 0, 50% 50%)",
        }}
      />
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: LUDO_COLORS.yellow,
          clipPath: "polygon(100% 0, 100% 100%, 50% 50%)",
        }}
      />
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: LUDO_COLORS.blue,
          clipPath: "polygon(0 100%, 100% 100%, 50% 50%)",
        }}
      />
      <span className="absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-zinc-300 bg-white" />
    </div>
  );
}

function BoardTokens({ tokens, movableIds, selectedId, onTokenClick }) {
  const groups = {};
  tokens.forEach((t) => {
    if (t.progress < 0) return;
    const cell = getTokenCell(t.color, t.progress);
    if (!cell) return;
    const key = `${cell[0]},${cell[1]}`;
    (groups[key] = groups[key] || []).push({ token: t, cell });
  });

  const unit = 100 / 15;
  const offsets = [
    [-0.9, -0.9],
    [0.9, -0.9],
    [-0.9, 0.9],
    [0.9, 0.9],
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      {Object.values(groups).flatMap((group) => {
        const crowded = group.length > 1;
        const sorted = [...group].sort((a, b) => a.token.id.localeCompare(b.token.id));
        return sorted.map(({ token, cell }, idx) => {
          const [r, c] = cell;
          const off = crowded ? offsets[idx % offsets.length] : [0, 0];
          const movable = movableIds.includes(token.id);
          const selected = selectedId === token.id;
          return (
            <button
              key={token.id}
              type="button"
              disabled={!movable}
              onClick={() => onTokenClick?.(token.id)}
              aria-label={`${token.color} token${movable ? ", movable" : ""}`}
              className={`pointer-events-auto absolute transition-[left,top] duration-200 ease-linear ${
                movable ? "cursor-pointer" : "cursor-default"
              }`}
              style={{
                left: `${((c + 0.5) / 15) * 100 + (off[0] * unit) / 4}%`,
                top: `${((r + 0.5) / 15) * 100 + (off[1] * unit) / 4}%`,
                width: `${crowded ? 3.4 : 5.4}%`,
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
              }}
            >
              <LudoToken
                color={LUDO_COLORS[token.color]}
                title={`${token.color} token`}
                movable={movable}
                selected={selected}
                className="h-full w-full"
              />
            </button>
          );
        });
      })}
    </div>
  );
}

export default function LudoBoard({ tokens = [], movableIds = [], selectedId = null, onTokenClick = null }) {
  return (
    <div
      role="img"
      aria-label="Classic Ludo board with red, green, yellow and blue houses"
      className="relative grid aspect-square w-full grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] overflow-hidden rounded-lg border-2 border-zinc-800 bg-white"
    >
      {QUADRANTS.map((q) => (
        <HomeBase
          key={q.color}
          {...q}
          tokens={tokens}
          movableIds={movableIds}
          selectedId={selectedId}
          onTokenClick={onTokenClick}
        />
      ))}

      {armCells().map(([r, c]) => {
        const key = `${r},${c}`;
        const lane = LANE_MAP[key];
        const start = START_CELLS[key];
        return (
          <LudoCell
            key={key}
            style={{ gridRow: r + 1, gridColumn: c + 1 }}
            color={lane ? LUDO_COLORS[lane] : start ? LUDO_COLORS[start.color] : null}
            start={start ? { hex: LUDO_COLORS[start.color], direction: start.direction } : null}
            star={!start && STAR_CELLS.includes(key)}
          />
        );
      })}

      <FinishHome />
      <BoardTokens
        tokens={tokens}
        movableIds={movableIds}
        selectedId={selectedId}
        onTokenClick={onTokenClick}
      />
    </div>
  );
}
