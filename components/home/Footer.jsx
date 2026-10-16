import { Dices } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-5 text-xs text-zinc-500 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
          <Dices className="h-4 w-4" /> LudoVerse
        </span>
      </div>
    </footer>
  );
}
