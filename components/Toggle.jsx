"use client";

export default function Toggle({
  id,
  checked,
  onChange,
  label,
  description = "",
  disabled = false,
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={`block cursor-pointer text-sm font-medium text-zinc-800 ${disabled ? "cursor-not-allowed" : ""}`}
        >
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${
          checked ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 bg-zinc-200"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
