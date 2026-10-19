import { AI_DIFFICULTIES } from "./ai-opponent";

export const SETTINGS_KEY = "ludoverse.settings.v1";

export const THEMES = {
  classic: {
    label: "Classic",
    colors: { red: "#E53935", green: "#43A047", yellow: "#F9A825", blue: "#1E88E5" },
  },
  dark: {
    label: "Dark",
    colors: { red: "#C62828", green: "#2E7D32", yellow: "#EF6C00", blue: "#1565C0" },
  },
  ocean: {
    label: "Ocean",
    colors: { red: "#F4511E", green: "#26A69A", yellow: "#FFB300", blue: "#1E88E5" },
  },
  forest: {
    label: "Forest",
    colors: { red: "#BF360C", green: "#33691E", yellow: "#9E9D24", blue: "#004D40" },
  },
};

export function defaultSettings() {
  return {
    general: {
      players: 2,
      opponent: "ai",
      difficulty: "medium",
      confirmRestart: true,
    },
    sound: {
      effects: true,
      dice: true,
      movement: true,
      capture: true,
      victory: true,
    },
    appearance: {
      theme: "classic",
      animations: true,
      diceAnimation: true,
      tokenAnimation: true,
      reducedMotion: false,
    },
    gameplay: {
      highlightMoves: true,
      playerIndicator: true,
      moveHints: true,
      confirmLeave: true,
    },
  };
}

function asBool(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function asEnum(value, options, fallback) {
  return options.includes(value) ? value : fallback;
}

export function sanitizeSettings(data) {
  const d = defaultSettings();
  if (!data || typeof data !== "object") return d;
  const g = data.general ?? {};
  const s = data.sound ?? {};
  const a = data.appearance ?? {};
  const gp = data.gameplay ?? {};
  return {
    general: {
      players: [2, 3, 4].includes(g.players) ? g.players : d.general.players,
      opponent: asEnum(g.opponent, ["ai", "local"], d.general.opponent),
      difficulty: asEnum(g.difficulty, AI_DIFFICULTIES, d.general.difficulty),
      confirmRestart: asBool(g.confirmRestart, d.general.confirmRestart),
    },
    sound: {
      effects: asBool(s.effects, d.sound.effects),
      dice: asBool(s.dice, d.sound.dice),
      movement: asBool(s.movement, d.sound.movement),
      capture: asBool(s.capture, d.sound.capture),
      victory: asBool(s.victory, d.sound.victory),
    },
    appearance: {
      theme: asEnum(a.theme, Object.keys(THEMES), d.appearance.theme),
      animations: asBool(a.animations, d.appearance.animations),
      diceAnimation: asBool(a.diceAnimation, d.appearance.diceAnimation),
      tokenAnimation: asBool(a.tokenAnimation, d.appearance.tokenAnimation),
      reducedMotion: asBool(a.reducedMotion, d.appearance.reducedMotion),
    },
    gameplay: {
      highlightMoves: asBool(gp.highlightMoves, d.gameplay.highlightMoves),
      playerIndicator: asBool(gp.playerIndicator, d.gameplay.playerIndicator),
      moveHints: asBool(gp.moveHints, d.gameplay.moveHints),
      confirmLeave: asBool(gp.confirmLeave, d.gameplay.confirmLeave),
    },
  };
}

export function loadSettings() {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  const clean = sanitizeSettings(settings);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ v: 1, ...clean }));
    }
  } catch {}
  return clean;
}

export function updateSettings(patch) {
  const next = loadSettings();
  if (patch?.general) next.general = { ...next.general, ...patch.general };
  if (patch?.sound) next.sound = { ...next.sound, ...patch.sound };
  if (patch?.appearance) next.appearance = { ...next.appearance, ...patch.appearance };
  if (patch?.gameplay) next.gameplay = { ...next.gameplay, ...patch.gameplay };
  return saveSettings(next);
}

export function resetSettings() {
  return saveSettings(defaultSettings());
}
