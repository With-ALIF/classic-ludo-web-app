const STORAGE_KEY = "ludoverse.activeGame.v1";

export function loadActiveGame(signature) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) return null;
    if (data.colorsKey !== signature.colorsKey || data.rosterRaw !== signature.rosterRaw) return null;
    const tokensOk =
      Array.isArray(data.tokens) &&
      data.tokens.length > 0 &&
      data.tokens.every(
        (t) =>
          t &&
          typeof t.id === "string" &&
          typeof t.color === "string" &&
          typeof t.index === "number" &&
          typeof t.progress === "number"
      );
    if (!tokensOk) return null;
    if (typeof data.currentPlayerIdx !== "number" || data.currentPlayerIdx < 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveActiveGame(snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...snapshot }));
  } catch {}
}

export function clearActiveGame() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
