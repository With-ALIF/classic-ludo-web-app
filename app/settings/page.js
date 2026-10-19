"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Database,
  Gamepad2,
  Home,
  Info,
  Palette,
  RotateCcw,
  Trash2,
  Users,
  Volume2,
} from "lucide-react";
import Header from "../../components/Header";
import Toggle from "../../components/Toggle";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  THEMES,
  defaultSettings,
  loadSettings,
  resetSettings,
  updateSettings,
} from "../../lib/settings";
import { clearHistory } from "../../lib/game-history";

const SECTIONS = [
  { id: "general", label: "General", icon: Users, desc: "Defaults for new matches." },
  { id: "sound", label: "Sound", icon: Volume2, desc: "Control which game sounds play." },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Board theme and animations." },
  { id: "gameplay", label: "Gameplay", icon: Gamepad2, desc: "Hints, indicators and confirmations." },
  { id: "data", label: "Data & Privacy", icon: Database, desc: "Local data stored on this device." },
];

const THEME_ORDER = ["classic", "dark", "ocean", "forest"];

function Segment({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {opt.dots && (
              <span className="flex gap-0.5">
                {opt.dots.map((c) => (
                  <span
                    key={c}
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: THEMES[opt.value].colors[c] }}
                  />
                ))}
              </span>
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Row({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultSettings);
  const [activeSection, setActiveSection] = useState("general");
  const [status, setStatus] = useState("saved");
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);
  const statusTimer = useRef(null);
  const noticeTimer = useRef(null);

  useEffect(() => {
    setSettings(loadSettings());
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const apply = (patch) => {
    const next = updateSettings(patch);
    setSettings(next);
    setStatus("saving");
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus("saved"), 450);
  };

  const showNotice = (text) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/game");
  };

  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  const SectionIcon = section.icon;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-semibold text-zinc-600 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Settings
          </h1>
          <p className="text-sm text-zinc-600 sm:text-base">
            Customize your Ludo experience.
          </p>
        </div>

        <nav
          aria-label="Settings sections"
          className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden"
        >
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                aria-current={active ? "true" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-500"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="sticky top-20 hidden lg:block">
            <nav
              aria-label="Settings sections"
              className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm"
            >
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:bg-indigo-500"
                        : "text-zinc-600 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            <section
              key={section.id}
              aria-labelledby={`section-${section.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id={`section-${section.id}`}
                className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900"
              >
                <SectionIcon className="h-4 w-4" />
                {section.label}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">{section.desc}</p>

              <div className="mt-4 divide-y divide-zinc-100">
                {activeSection === "general" && (
                  <>
                    <Row title="Default Players" description="Pre-selected when you set up a match.">
                      <Segment
                        label="Default players"
                        value={settings.general.players}
                        options={[
                          { value: 2, label: "2 Players" },
                          { value: 3, label: "3 Players" },
                          { value: 4, label: "4 Players" },
                        ]}
                        onChange={(v) => apply({ general: { players: v } })}
                      />
                    </Row>
                    <Row title="Default Opponent" description="Play against the AI or friends on one screen.">
                      <Segment
                        label="Default opponent"
                        value={settings.general.opponent}
                        options={[
                          { value: "ai", label: "AI Opponents" },
                          { value: "local", label: "Local Multiplayer" },
                        ]}
                        onChange={(v) => apply({ general: { opponent: v } })}
                      />
                    </Row>
                    {settings.general.opponent === "ai" && (
                      <Row title="Default AI Difficulty" description="Used for AI opponents in new matches.">
                        <Segment
                          label="Default AI difficulty"
                          value={settings.general.difficulty}
                          options={[
                            { value: "easy", label: "Easy" },
                            { value: "medium", label: "Medium" },
                            { value: "hard", label: "Hard" },
                          ]}
                          onChange={(v) => apply({ general: { difficulty: v } })}
                        />
                      </Row>
                    )}
                    <div className="py-4">
                      <Toggle
                        id="confirm-restart"
                        checked={settings.general.confirmRestart}
                        onChange={(v) => apply({ general: { confirmRestart: v } })}
                        label="Confirm Before Restart"
                        description="Ask before starting a new game from an active match."
                      />
                    </div>
                  </>
                )}

                {activeSection === "sound" && (
                  <>
                    <div className="py-4">
                      <Toggle
                        id="sound-effects"
                        checked={settings.sound.effects}
                        onChange={(v) => apply({ sound: { effects: v } })}
                        label="Sound Effects"
                        description="Master switch for all game sounds."
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="sound-dice"
                        checked={settings.sound.dice}
                        onChange={(v) => apply({ sound: { dice: v } })}
                        label="Dice Sound"
                        disabled={!settings.sound.effects}
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="sound-movement"
                        checked={settings.sound.movement}
                        onChange={(v) => apply({ sound: { movement: v } })}
                        label="Token Movement Sound"
                        disabled={!settings.sound.effects}
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="sound-capture"
                        checked={settings.sound.capture}
                        onChange={(v) => apply({ sound: { capture: v } })}
                        label="Capture Sound"
                        disabled={!settings.sound.effects}
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="sound-victory"
                        checked={settings.sound.victory}
                        onChange={(v) => apply({ sound: { victory: v } })}
                        label="Victory Sound"
                        disabled={!settings.sound.effects}
                      />
                    </div>
                  </>
                )}

                {activeSection === "appearance" && (
                  <>
                    <Row title="Board Theme" description="Visual colors only — rules and paths never change.">
                      <Segment
                        label="Board theme"
                        value={settings.appearance.theme}
                        options={THEME_ORDER.map((key) => ({
                          value: key,
                          label: THEMES[key].label,
                          dots: ["red", "green", "yellow", "blue"],
                        }))}
                        onChange={(v) => apply({ appearance: { theme: v } })}
                      />
                    </Row>
                    <div className="py-4">
                      <Toggle
                        id="animations"
                        checked={settings.appearance.animations}
                        onChange={(v) => apply({ appearance: { animations: v } })}
                        label="Animations"
                        description="Master switch for visual motion."
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="dice-animation"
                        checked={settings.appearance.diceAnimation}
                        onChange={(v) => apply({ appearance: { diceAnimation: v } })}
                        label="Dice Rolling Animation"
                        disabled={!settings.appearance.animations}
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="token-animation"
                        checked={settings.appearance.tokenAnimation}
                        onChange={(v) => apply({ appearance: { tokenAnimation: v } })}
                        label="Token Movement Animation"
                        description="Off moves tokens instantly to their destination."
                        disabled={!settings.appearance.animations}
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="reduced-motion"
                        checked={settings.appearance.reducedMotion}
                        onChange={(v) => apply({ appearance: { reducedMotion: v } })}
                        label="Reduced Motion"
                        description="Minimizes non-essential movement and celebration effects."
                      />
                    </div>
                  </>
                )}

                {activeSection === "gameplay" && (
                  <>
                    <Row title="AI Difficulty" description="Applies whenever AI opponents are playing.">
                      <Segment
                        label="AI difficulty"
                        value={settings.general.difficulty}
                        options={[
                          { value: "easy", label: "Easy" },
                          { value: "medium", label: "Medium" },
                          { value: "hard", label: "Hard" },
                        ]}
                        onChange={(v) => apply({ general: { difficulty: v } })}
                      />
                    </Row>
                    <div className="py-4">
                      <Toggle
                        id="highlight-moves"
                        checked={settings.gameplay.highlightMoves}
                        onChange={(v) => apply({ gameplay: { highlightMoves: v } })}
                        label="Highlight Valid Moves"
                        description="Glow the tokens you can move after a roll."
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="player-indicator"
                        checked={settings.gameplay.playerIndicator}
                        onChange={(v) => apply({ gameplay: { playerIndicator: v } })}
                        label="Show Current Player Indicator"
                        description="Mark whose turn it is on the board panels."
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="move-hints"
                        checked={settings.gameplay.moveHints}
                        onChange={(v) => apply({ gameplay: { moveHints: v } })}
                        label="Show Move Hints"
                        description="Show short guidance text during your turn."
                      />
                    </div>
                    <div className="py-4">
                      <Toggle
                        id="confirm-leave"
                        checked={settings.gameplay.confirmLeave}
                        onChange={(v) => apply({ gameplay: { confirmLeave: v } })}
                        label="Confirm Before Leaving an Active Game"
                        description="Warns before closing or refreshing while a match is in progress. Ongoing games are also restored automatically."
                      />
                    </div>
                  </>
                )}

                {activeSection === "data" && (
                  <>
                    <div className="py-4">
                      <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        <p className="text-xs leading-relaxed text-zinc-600">
                          Settings and game history are stored locally in this browser
                          (localStorage) on this device only. There is no account, server
                          sync, or cloud backup — clearing browser data or using another
                          device will not carry your data over.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 py-4 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setDialog("clearHistory")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear Game History
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog("resetSettings")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset Settings to Defaults
                      </button>
                    </div>
                    <p className="pb-1 text-xs text-zinc-400">
                      Clearing history does not change your settings. Resetting settings does
                      not delete history. An ongoing match is never removed by these actions.
                    </p>
                  </>
                )}
              </div>
            </section>

            {notice && (
              <div
                role="status"
                className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800"
              >
                <Check className="h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500"
              >
                {status === "saved" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-zinc-300" />
                )}
                {status === "saving" ? "Saving…" : "All changes saved"}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDialog("resetSettings")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Defaults
                </button>
                <Link
                  href="/game"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                >
                  <Home className="h-4 w-4" />
                  Back to Game
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={dialog === "clearHistory"}
        title="Clear game history?"
        message="All saved matches and statistics on this device will be removed. Your settings are not affected."
        confirmLabel="Clear history"
        destructive
        onConfirm={() => {
          clearHistory();
          setDialog(null);
          showNotice("Game history cleared. Settings kept.");
        }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "resetSettings"}
        title="Reset settings?"
        message="All preferences return to their defaults. Your game history is not affected."
        confirmLabel="Reset settings"
        destructive
        onConfirm={() => {
          setSettings(resetSettings());
          setDialog(null);
          showNotice("Settings reset to defaults. History kept.");
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
