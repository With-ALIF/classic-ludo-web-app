import { getTokenCell, isSafeCell, findVictims, canTokenMove } from "../components/ludo-config";

export const AI_DIFFICULTIES = ["easy", "medium", "hard"];

function destOf(token, dice) {
  return token.progress === -1 ? 0 : token.progress + dice;
}

function isSafeProgress(color, progress) {
  if (progress === 56) return true;
  const cell = getTokenCell(color, progress);
  return !!cell && isSafeCell(cell[0], cell[1]);
}

function threatCount(tokens, moverColor, dest) {
  const cell = getTokenCell(moverColor, dest);
  if (!cell || isSafeCell(cell[0], cell[1])) return 0;
  let threats = 0;
  for (const t of tokens) {
    if (t.color === moverColor || t.progress < 0 || t.progress >= 56) continue;
    for (let k = 1; k <= 6; k++) {
      const p = t.progress + k;
      if (p > 56) break;
      const c = getTokenCell(t.color, p);
      if (c && c[0] === cell[0] && c[1] === cell[1]) {
        threats++;
        break;
      }
    }
  }
  return threats;
}

function scoreMove({ tokens, token, dice, difficulty }) {
  const dest = destOf(token, dice);
  const fromBase = token.progress === -1;
  let score = 0;

  const victims = findVictims(tokens, token.color, dest);
  if (victims.length > 0) score += 120 + victims.length * 20;

  if (dest === 56) score += 100;
  else if (fromBase) score += 60;

  score += dest * 1.2;

  const destSafe = isSafeProgress(token.color, dest);
  if (destSafe) score += 25;

  if (difficulty === "hard") {
    if (!fromBase && token.progress >= 0 && !isSafeProgress(token.color, token.progress)) {
      score += destSafe ? 18 : 8;
    }
    if (!destSafe && dest !== 56) {
      score -= threatCount(tokens, token.color, dest) * 40;
    }
  }

  return score;
}

export function chooseAiMove({ tokens, movableIds, dice, difficulty = "medium" }) {
  const legal = (tokens || []).filter(
    (t) => movableIds.includes(t.id) && canTokenMove(t, dice)
  );
  if (legal.length === 0) return null;
  if (difficulty === "easy") {
    return legal[Math.floor(Math.random() * legal.length)];
  }

  const scored = legal.map((token) => ({
    token,
    score: scoreMove({ tokens, token, dice, difficulty }),
  }));
  const max = Math.max(...scored.map((s) => s.score));
  const band = difficulty === "hard" ? 8 : 15;
  const top = scored.filter((s) => s.score >= max - band);
  return top[Math.floor(Math.random() * top.length)].token;
}
