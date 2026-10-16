"use client";

import { useEffect, useState } from "react";

function randomFace() {
  return Math.floor(Math.random() * 6) + 1;
}

const PIPS = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

export default function Dice({ value = 1, rolling = false, className = "" }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!rolling) {
      setDisplay(value);
      return;
    }
    const id = setInterval(() => setDisplay(randomFace()), 90);
    return () => clearInterval(id);
  }, [rolling, value]);

  const pips = PIPS[display] ?? PIPS[1];

  return (
    <div
      role="img"
      aria-label={rolling ? "Dice rolling" : `Dice showing ${display}`}
      className={`grid h-20 w-20 grid-cols-3 grid-rows-3 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm ${rolling ? "animate-dice-shake" : ""} ${className}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i + 1} className="flex items-center justify-center">
          {pips.includes(i + 1) && (
            <span className="h-[68%] w-[68%] rounded-full bg-zinc-900" />
          )}
        </span>
      ))}
    </div>
  );
}
