import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from "lucide-react";

const ARROWS = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};

export default function LudoCell({ color = null, start = null, star = false, style }) {
  const ArrowIcon = start ? ARROWS[start.direction] : null;

  return (
    <div
      className="flex items-center justify-center ring-1 ring-inset ring-zinc-300"
      style={{ ...style, backgroundColor: color ?? "#ffffff" }}
    >
      {ArrowIcon && (
        <ArrowIcon
          className="h-3/5 w-3/5 text-white"
          strokeWidth={2.75}
          aria-label="Starting cell"
        />
      )}
      {!ArrowIcon && star && (
        <Star
          className="h-1/2 w-1/2 text-zinc-500"
          fill="currentColor"
          strokeWidth={1}
          aria-label="Safe cell"
        />
      )}
    </div>
  );
}
