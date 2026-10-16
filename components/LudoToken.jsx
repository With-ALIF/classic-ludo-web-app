export default function LudoToken({
  color,
  title,
  className = "h-[80%] w-[80%]",
  movable = false,
  selected = false,
}) {
  return (
    <span
      title={title}
      className={`flex items-center justify-center rounded-full border-2 border-white transition-transform ${selected ? "scale-110" : ""} ${
        movable && !selected ? "hover:scale-110" : ""
      } ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: selected
          ? "0 0 0 2px #ffffff, 0 0 0 4px #18181b, 0 2px 6px rgba(0,0,0,0.4)"
          : movable
            ? "0 0 0 2px rgba(255,255,255,0.95), 0 1px 3px rgba(0,0,0,0.35)"
            : "0 1px 3px rgba(0,0,0,0.35)",
      }}
    >
      <span className="h-[34%] w-[34%] rounded-full bg-white/95" />
    </span>
  );
}
