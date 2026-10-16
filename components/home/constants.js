export const PLAYER_OPTIONS = [
  { value: 2, label: "2 Players", desc: "Red vs Yellow" },
  { value: 3, label: "3 Players", desc: "Red • Green • Yellow" },
  { value: 4, label: "4 Players", desc: "Red • Green • Yellow • Blue" },
];

export const COLORS = [
  { name: "Red", hex: "#E53935", text: "text-white", ring: "ring-red-200" },
  { name: "Green", hex: "#43A047", text: "text-white", ring: "ring-green-200" },
  { name: "Yellow", hex: "#F9A825", text: "text-zinc-900", ring: "ring-yellow-200" },
  { name: "Blue", hex: "#1E88E5", text: "text-white", ring: "ring-blue-200" },
];


export const PLAYER_COLOR_INDEXES = {
  2: [0, 2],
  3: [0, 1, 2],
  4: [0, 1, 2, 3],
};
