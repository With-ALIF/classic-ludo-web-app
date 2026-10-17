export const HISTORY_KEY = "ludoverse.history.v1";
export const HISTORY_VERSION = 1;
export const MAX_MATCHES = 200;

const MODES = new Set(["offline", "online"]);
const RESULTS = new Set(["won", "lost", "draw"]);
const COLORS = new Set(["Red", "Green", "Yellow", "Blue"]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

const MODE_LABELS = { offline: "Offline", online: "Online" };
const RESULT_LABELS = { won: "Won", lost: "Lost", draw: "Draw" };

export function modeLabel(mode) {
  return MODE_LABELS[mode] ?? "Unknown";
}

export function resultLabel(result) {
  return RESULT_LABELS[result] ?? "—";
}

export function createMatchId() {
  return `mv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "__ludoverse_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidParticipant(p) {
  if (!p || typeof p !== "object") return false;
  if (typeof p.name !== "string" || !p.name.trim()) return false;
  if (!COLORS.has(p.color)) return false;
  if (typeof p.isAi !== "boolean") return false;
  if (p.isAi && p.difficulty !== undefined && !DIFFICULTIES.has(p.difficulty)) return false;
  return true;
}

export function isValidRecord(r) {
  if (!r || typeof r !== "object") return false;
  if (!Number.isInteger(r.no) || r.no < 1) return false;
  return isValidRecordBody(r);
}

function isValidRecordBody(r) {
  if (!r || typeof r !== "object") return false;
  if (typeof r.id !== "string" || !r.id) return false;
  if (!MODES.has(r.mode)) return false;
  if (!Number.isFinite(r.startedAt) || !Number.isFinite(r.endedAt)) return false;
  if (r.endedAt < r.startedAt) return false;
  if (!Number.isFinite(r.durationMs) || r.durationMs < 0) return false;
  if (!Array.isArray(r.players) || r.players.length < 2 || r.players.length > 4) return false;
  if (!r.players.every(isValidParticipant)) return false;
  if (!Number.isInteger(r.playerCount) || r.playerCount !== r.players.length) return false;
  if (!Number.isInteger(r.localIndex) || r.localIndex < -1 || r.localIndex >= r.players.length)
    return false;
  if (r.localIndex >= 0 && r.players[r.localIndex].isAi) return false;
  if (!Number.isInteger(r.winnerIndex) || r.winnerIndex < -1 || r.winnerIndex >= r.players.length)
    return false;
  if (!RESULTS.has(r.result)) return false;
  if (r.winnerIndex === -1) {
    if (r.winner !== null) return false;
  } else {
    if (!r.winner || typeof r.winner !== "object") return false;
    const wp = r.players[r.winnerIndex];
    if (r.winner.name !== wp.name || r.winner.color !== wp.color) return false;
  }
  if (r.result === "won" && !(r.localIndex >= 0 && r.winnerIndex === r.localIndex)) return false;
  if (
    r.result === "lost" &&
    !(r.localIndex >= 0 && r.winnerIndex >= 0 && r.winnerIndex !== r.localIndex)
  )
    return false;
  if (r.result === "draw" && !(r.winnerIndex === -1 || r.localIndex === -1)) return false;
  return true;
}

export function buildMatchRecord({ id, mode, players, winnerIndex, startedAt, endedAt }) {
  const safePlayers = (Array.isArray(players) ? players : []).map((p) => {
    const isAi = !!(p && p.isAi);
    const rawName = p && typeof p.name === "string" ? p.name.trim() : "";
    const difficulty =
      p && DIFFICULTIES.has(p.difficulty) ? p.difficulty : "medium";
    return {
      name: rawName.slice(0, 16) || (isAi ? "AI" : "Player"),
      color: p && COLORS.has(p.color) ? p.color : "Red",
      isAi,
      ...(isAi ? { difficulty } : {}),
    };
  });
  const localIndex = safePlayers.findIndex((p) => !p.isAi);
  const hasWinner =
    Number.isInteger(winnerIndex) && winnerIndex >= 0 && winnerIndex < safePlayers.length;
  const winner = hasWinner
    ? { name: safePlayers[winnerIndex].name, color: safePlayers[winnerIndex].color }
    : null;
  let result;
  if (!hasWinner || localIndex === -1) result = "draw";
  else if (winnerIndex === localIndex) result = "won";
  else result = "lost";
  const start = Number.isFinite(startedAt) ? startedAt : Number.isFinite(endedAt) ? endedAt : Date.now();
  const end = Number.isFinite(endedAt) ? endedAt : start;
  return {
    id: typeof id === "string" && id ? id : createMatchId(),
    mode: MODES.has(mode) ? mode : "offline",
    startedAt: start,
    endedAt: end,
    durationMs: Math.max(0, end - start),
    playerCount: safePlayers.length,
    players: safePlayers,
    localIndex,
    winnerIndex: hasWinner ? winnerIndex : -1,
    winner,
    result,
  };
}

export function loadHistory() {
  const storage = getStorage();
  if (!storage) return { matches: [], error: "unavailable" };
  let raw = null;
  try {
    raw = storage.getItem(HISTORY_KEY);
  } catch {
    return { matches: [], error: "unavailable" };
  }
  if (raw === null || raw === undefined || raw === "") return { matches: [], error: null };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { matches: [], error: "malformed" };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.matches))
    return { matches: [], error: "malformed" };
  if (parsed.version !== HISTORY_VERSION) return { matches: [], error: "unsupported" };
  const seen = new Set();
  const valid = [];
  for (const m of parsed.matches) {
    if (isValidRecord(m) && !seen.has(m.id)) {
      seen.add(m.id);
      valid.push(m);
    }
  }
  valid.sort((a, b) => b.endedAt - a.endedAt);
  return { matches: valid.slice(0, MAX_MATCHES), error: null };
}

export function saveMatch(record) {
  if (!isValidRecordBody(record)) return { ok: false, error: "invalid", matches: [] };
  const storage = getStorage();
  if (!storage) return { ok: false, error: "unavailable", matches: [] };
  try {
    const loaded = loadHistory();
    if (loaded.error === "unsupported")
      return { ok: false, error: "unsupported", matches: [] };
    const existing = loaded.matches;
    if (existing.some((m) => m.id === record.id))
      return { ok: false, error: "duplicate", matches: existing };
    const maxNo = existing.reduce((mx, m) => Math.max(mx, m.no), 0);
    const stored = { ...record, no: maxNo + 1 };
    const matches = [stored, ...existing].slice(0, MAX_MATCHES);
    storage.setItem(
      HISTORY_KEY,
      JSON.stringify({ version: HISTORY_VERSION, nextNo: maxNo + 2, matches })
    );
    return { ok: true, error: null, matches, match: stored };
  } catch {
    return { ok: false, error: "unavailable", matches: [] };
  }
}

export function clearHistory() {
  const storage = getStorage();
  if (!storage) return { ok: false, error: "unavailable" };
  try {
    storage.removeItem(HISTORY_KEY);
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export function computeStats(matches) {
  const list = [...(Array.isArray(matches) ? matches : [])].sort(
    (a, b) => a.endedAt - b.endedAt
  );
  let played = 0;
  let won = 0;
  let lost = 0;
  let draw = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  const modeCounts = {};
  const colorStats = {};
  for (const m of list) {
    played += 1;
    modeCounts[m.mode] = (modeCounts[m.mode] ?? 0) + 1;
    if (m.result === "won") {
      won += 1;
      currentStreak += 1;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      currentStreak = 0;
      if (m.result === "lost") lost += 1;
      else draw += 1;
    }
    const local = m.localIndex >= 0 ? m.players[m.localIndex] : null;
    if (local) {
      const entry = colorStats[local.color] ?? { color: local.color, used: 0, wins: 0 };
      entry.used += 1;
      if (m.result === "won") entry.wins += 1;
      colorStats[local.color] = entry;
    }
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;
  let topMode = null;
  for (const mode of Object.keys(modeCounts)) {
    const count = modeCounts[mode];
    if (!topMode || count > topMode.count) topMode = { mode, count };
  }
  let favoriteColor = null;
  for (const entry of Object.values(colorStats)) {
    if (
      !favoriteColor ||
      entry.wins > favoriteColor.wins ||
      (entry.wins === favoriteColor.wins && entry.used > favoriteColor.used)
    )
      favoriteColor = entry;
  }
  return {
    played,
    won,
    lost,
    draw,
    winRate: played > 0 ? Math.round((won / played) * 100) : 0,
    currentStreak,
    bestStreak,
    topMode,
    favoriteColor,
  };
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMatchDate(ts) {
  if (!Number.isFinite(ts)) return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function buildJsonExport(matches) {
  return JSON.stringify(
    {
      app: "LudoVerse",
      schema: "ludoverse-history",
      version: HISTORY_VERSION,
      exportedAt: new Date().toISOString(),
      count: matches.length,
      matches,
    },
    null,
    2
  );
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsvExport(matches) {
  const header = [
    "Match No",
    "Date",
    "Mode",
    "Players",
    "Participants",
    "Winner",
    "Winner Color",
    "Winner Type",
    "Result",
    "Duration (seconds)",
  ];
  const rows = matches.map((m) => [
    m.no,
    new Date(m.endedAt).toISOString(),
    modeLabel(m.mode),
    m.playerCount,
    m.players
      .map(
        (p) =>
          `${p.name} (${p.color}, ${p.isAi ? `AI${p.difficulty ? ` ${p.difficulty}` : ""}` : "Human"})`
      )
      .join("; "),
    m.winner ? m.winner.name : "",
    m.winner ? m.winner.color : "",
    m.winnerIndex >= 0 ? (m.players[m.winnerIndex] && m.players[m.winnerIndex].isAi ? "AI" : "Human") : "",
    resultLabel(m.result),
    Math.round(m.durationMs / 1000),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJsonFile(matches) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadText(`ludoverse-history-${stamp}.json`, buildJsonExport(matches), "application/json");
}

export function exportCsvFile(matches) {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadText(`ludoverse-history-${stamp}.csv`, buildCsvExport(matches), "text/csv");
}
