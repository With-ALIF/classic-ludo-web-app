export const LUDO_COLORS = {
  red: "#E53935",
  green: "#43A047",
  yellow: "#F9A825",
  blue: "#1E88E5",
};

export const START_CELLS = {
  "6,1": { color: "red", direction: "right" },
  "1,8": { color: "green", direction: "down" },
  "8,13": { color: "yellow", direction: "left" },
  "13,6": { color: "blue", direction: "up" },
};

export const STAR_CELLS = ["2,6", "6,12", "12,8", "8,2"];

export const SAFE_CELL_KEYS = new Set([...Object.keys(START_CELLS), ...STAR_CELLS]);

export function cellKey(r, c) {
  return `${r},${c}`;
}

export function isSafeCell(r, c) {
  return SAFE_CELL_KEYS.has(cellKey(r, c));
}

const MAIN_LOOP = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };

const HOME_STRETCH = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

function buildColorPath(color) {
  const start = START_INDEX[color];
  const outer = [];
  for (let k = 0; k < 51; k++) {
    outer.push(MAIN_LOOP[(start + k) % MAIN_LOOP.length]);
  }
  return [...outer, ...HOME_STRETCH[color]];
}

export const COLOR_PATHS = {
  red: buildColorPath("red"),
  green: buildColorPath("green"),
  yellow: buildColorPath("yellow"),
  blue: buildColorPath("blue"),
};

export function getTokenCell(color, progress) {
  if (progress < 0 || progress > 56) return null;
  return COLOR_PATHS[color][progress] ?? null;
}
