"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  ChevronRight,
  Clock,
  Crown,
  Download,
  FileSpreadsheet,
  Flame,
  Gamepad2,
  Globe,
  History as HistoryIcon,
  Medal,
  Palette,
  Percent,
  RotateCcw,
  Search,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/home/Footer";
import ConfirmDialog from "../../components/ConfirmDialog";
import { LUDO_COLORS } from "../../components/ludo-config";
import {
  clearHistory,
  computeStats,
  exportCsvFile,
  exportJsonFile,
  formatDuration,
  formatMatchDate,
  loadHistory,
  modeLabel,
} from "../../lib/game-history";

const PAGE_SIZE = 10;

const MODE_OPTIONS = [
  { value: "all", label: "All modes" },
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
];

const RESULT_OPTIONS = [
  { value: "all", label: "All results" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "draw", label: "Draw" },
];

const RESULT_BADGES = {
  won: { label: "Won", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  lost: { label: "Lost", className: "border-red-200 bg-red-50 text-red-700" },
  draw: { label: "Draw", className: "border-zinc-200 bg-zinc-100 text-zinc-600" },
};

const ERROR_MESSAGES = {
  unavailable:
    "Local storage isn't available in this browser, so history can't be loaded or saved on this device.",
  malformed: "The saved history data looks corrupted and couldn't be read.",
  unsupported:
    "The saved history was written by a newer version of LudoVerse and can't be read here.",
};

function colorHex(colorName) {
  return LUDO_COLORS[String(colorName ?? "").toLowerCase()] ?? "#a1a1aa";
}

function readStoredHistory() {
  return loadHistory();
}

function ResultBadge({ result, className = "" }) {
  const badge = RESULT_BADGES[result] ?? RESULT_BADGES.draw;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
      <div className="mt-3 h-7 w-16 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
        <div className="h-4 w-14 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

export default function HistoryPage() {
  const [status, setStatus] = useState("loading");
  const [matches, setMatches] = useState([]);
  const [errorKind, setErrorKind] = useState(null);
  const [modeFilter, setModeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  useEffect(() => {
    const { matches: list, error } = readStoredHistory();
    if (error) {
      setMatches([]);
      setErrorKind(error);
      setStatus("error");
    } else {
      setMatches(list);
      setErrorKind(null);
      setStatus("ready");
    }
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [modeFilter, resultFilter, fromDate, toDate, query]);

  const showNotice = (text, tone = "ok") => {
    setNotice({ text, tone });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  };

  const handleReload = () => {
    setStatus("loading");
    const { matches: list, error } = readStoredHistory();
    if (error) {
      setMatches([]);
      setErrorKind(error);
      setStatus("error");
    } else {
      setMatches(list);
      setErrorKind(null);
      setStatus("ready");
    }
  };

  const stats = useMemo(() => computeStats(matches), [matches]);

  const filteredMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTs = fromDate ? Date.parse(`${fromDate}T00:00:00`) : NaN;
    const toTs = toDate ? Date.parse(`${toDate}T23:59:59.999`) : NaN;
    return matches.filter((m) => {
      if (modeFilter !== "all" && m.mode !== modeFilter) return false;
      if (resultFilter !== "all" && m.result !== resultFilter) return false;
      if (Number.isFinite(fromTs) && m.endedAt < fromTs) return false;
      if (Number.isFinite(toTs) && m.endedAt > toTs) return false;
      if (q) {
        const haystack = [
          ...m.players.map((p) => p.name),
          m.winner ? m.winner.name : "",
          m.winner ? m.winner.color : "",
          `match ${m.no}`,
          String(m.no),
          m.id,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [matches, modeFilter, resultFilter, fromDate, toDate, query]);

  const visibleMatches = filteredMatches.slice(0, visible);

  const hasFilters =
    modeFilter !== "all" ||
    resultFilter !== "all" ||
    !!fromDate ||
    !!toDate ||
    !!query.trim();

  const clearFilters = () => {
    setModeFilter("all");
    setResultFilter("all");
    setFromDate("");
    setToDate("");
    setQuery("");
  };

  const openConfirm = (action) => {
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const handleExport = (kind) => {
    try {
      if (kind === "csv") exportCsvFile(matches);
      else exportJsonFile(matches);
      showNotice(
        `Exported ${matches.length} match${matches.length === 1 ? "" : "es"} as ${kind.toUpperCase()}.`
      );
    } catch {
      showNotice("Export failed — the download was blocked by your browser.", "error");
    }
  };

  const handleConfirmAction = () => {
    const action = pendingAction;
    setConfirmOpen(false);
    setPendingAction(null);
    if (action === "discard") {
      const res = clearHistory();
      if (res.ok) {
        handleReload();
        showNotice("Unreadable history data was discarded.");
      } else {
        showNotice("Couldn't discard history — local storage is unavailable.", "error");
      }
      return;
    }
    const res = clearHistory();
    if (res.ok) {
      setMatches([]);
      setSelected(null);
      clearFilters();
      showNotice("History cleared. Sound preferences and other settings were not changed.");
    } else {
      showNotice("Couldn't clear history — local storage is unavailable.", "error");
    }
  };

  const statCards = [
    {
      key: "played",
      label: "Games Played",
      value: String(stats.played),
      caption: "Completed matches",
      Icon: Gamepad2,
    },
    {
      key: "won",
      label: "Games Won",
      value: String(stats.won),
      caption: "Local player victories",
      Icon: Trophy,
    },
    {
      key: "lost",
      label: "Games Lost",
      value: String(stats.lost),
      caption: "Matches won by opponents",
      Icon: Target,
    },
    {
      key: "rate",
      label: "Win Rate",
      value: stats.played > 0 ? `${stats.winRate}%` : "—",
      caption: "Won / played",
      Icon: Percent,
    },
    {
      key: "streak",
      label: "Current Streak",
      value: String(stats.currentStreak),
      caption: "Wins in a row",
      Icon: Flame,
    },
    {
      key: "best",
      label: "Best Streak",
      value: String(stats.bestStreak),
      caption: "Longest winning run",
      Icon: Medal,
    },
    {
      key: "mode",
      label: "Most-Played Mode",
      value: stats.topMode ? modeLabel(stats.topMode.mode) : "—",
      caption: stats.topMode
        ? `${stats.topMode.count} of ${stats.played} match${stats.played === 1 ? "" : "es"}`
        : "No matches yet",
      Icon: stats.topMode && stats.topMode.mode === "online" ? Globe : Users,
    },
    {
      key: "color",
      label: "Favorite Color",
      value: stats.favoriteColor ? stats.favoriteColor.color : "—",
      caption: stats.favoriteColor
        ? `${stats.favoriteColor.wins} win${stats.favoriteColor.wins === 1 ? "" : "s"} · ${stats.favoriteColor.used} game${stats.favoriteColor.used === 1 ? "" : "s"}`
        : "No matches yet",
      Icon: Palette,
      swatch: stats.favoriteColor ? colorHex(stats.favoriteColor.color) : null,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            History &amp; Statistics
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Your completed matches, streaks and records — stored on this device only.
          </p>
        </div>

        {notice && (
          <p
            role="status"
            className={`mx-auto mt-4 max-w-3xl rounded-lg border px-3 py-2 text-center text-xs font-medium ${
              notice.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice.text}
          </p>
        )}

        {status === "error" && (
          <section
            aria-label="History error"
            className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"
          >
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-zinc-900">
              Couldn&apos;t load history
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
              {ERROR_MESSAGES[errorKind] ?? ERROR_MESSAGES.unavailable}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleReload}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
              {errorKind === "malformed" && (
                <button
                  type="button"
                  onClick={() => openConfirm("discard")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Discard corrupted data
                </button>
              )}
            </div>
          </section>
        )}

        {status === "loading" && (
          <>
            <section aria-label="Statistics loading" className="mt-6">
              <div className="h-5 w-36 animate-pulse rounded bg-zinc-200" />
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </section>
            <section aria-label="History loading" className="mt-6 flex flex-col gap-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </section>
          </>
        )}

        {status === "ready" && (
          <>
            <section
              aria-label="Statistics"
              className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {statCards.map(({ key, label, value, caption, Icon, swatch }) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-500">{label}</p>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900">
                      {swatch && (
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-white shadow"
                          style={{ backgroundColor: swatch }}
                          aria-hidden="true"
                        />
                      )}
                      {value}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-400">{caption}</p>
                  </div>
                ))}
              </div>
            </section>

            {matches.length === 0 && (
              <section
                aria-label="No history yet"
                className="mt-5 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                  <HistoryIcon className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-lg font-bold tracking-tight text-zinc-900">
                  No matches yet
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                  Play a game — every finished match is saved here automatically, up to the
                  latest 200 matches in this browser.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                  <Link
                    href="/setup"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  >
                    <Gamepad2 className="h-4 w-4" />
                    Play a game
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    Back to home
                  </Link>
                </div>
              </section>
            )}

            {matches.length > 0 && (
              <section
                aria-label="Match history"
                className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <HistoryIcon className="h-4 w-4" />
                    Match History
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      {matches.length} total
                    </span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleExport("json")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport("csv")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => openConfirm("clear")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear history
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="history-mode"
                      className="text-xs font-medium text-zinc-600"
                    >
                      Mode
                    </label>
                    <select
                      id="history-mode"
                      value={modeFilter}
                      onChange={(e) => setModeFilter(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 sm:w-36"
                    >
                      {MODE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="history-result"
                      className="text-xs font-medium text-zinc-600"
                    >
                      Result
                    </label>
                    <select
                      id="history-result"
                      value={resultFilter}
                      onChange={(e) => setResultFilter(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 sm:w-36"
                    >
                      {RESULT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="history-from"
                      className="text-xs font-medium text-zinc-600"
                    >
                      From
                    </label>
                    <input
                      type="date"
                      id="history-from"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 sm:w-40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="history-to"
                      className="text-xs font-medium text-zinc-600"
                    >
                      To
                    </label>
                    <input
                      type="date"
                      id="history-to"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 sm:w-40"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <label
                      htmlFor="history-search"
                      className="text-xs font-medium text-zinc-600"
                    >
                      Search
                    </label>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        id="history-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Player or match name..."
                        className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                {hasFilters && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500">
                      Showing {visibleMatches.length} of {filteredMatches.length} match
                      {filteredMatches.length === 1 ? "" : "es"}
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Clear filters
                    </button>
                  </div>
                )}

                {filteredMatches.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center">
                    <p className="text-sm font-semibold text-zinc-800">
                      No matches match your filters
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Try a different mode, result, date range, or search term.
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    {!hasFilters && (
                      <p className="mt-3 text-xs text-zinc-500">
                        Showing {visibleMatches.length} of {filteredMatches.length} match
                        {filteredMatches.length === 1 ? "" : "es"} · newest first
                      </p>
                    )}
                    <ul className="mt-3 flex flex-col gap-2">
                      {visibleMatches.map((m) => {
                        const winnerIsAi =
                          m.winnerIndex >= 0 &&
                          m.players[m.winnerIndex] &&
                          m.players[m.winnerIndex].isAi;
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => setSelected(m)}
                              aria-label={`View details for match ${m.no}`}
                              className="group flex w-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-zinc-900">
                                    Match #{m.no}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                                    {m.mode === "online" ? (
                                      <Globe className="h-3 w-3" aria-hidden="true" />
                                    ) : (
                                      <Users className="h-3 w-3" aria-hidden="true" />
                                    )}
                                    {modeLabel(m.mode)}
                                  </span>
                                  <ResultBadge result={m.result} />
                                  <span className="text-[11px] text-zinc-400">
                                    {formatMatchDate(m.endedAt)}
                                  </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {m.players.map((p, idx) => (
                                    <span
                                      key={`${m.id}-${idx}`}
                                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                                    >
                                      <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: colorHex(p.color) }}
                                        aria-hidden="true"
                                      />
                                      <span className="truncate">{p.name}</span>
                                      {idx === m.localIndex && (
                                        <span className="text-[10px] font-semibold uppercase text-zinc-400">
                                          You
                                        </span>
                                      )}
                                      {p.isAi && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase text-zinc-400">
                                          <Bot className="h-3 w-3" aria-hidden="true" />
                                          {p.difficulty || "AI"}
                                        </span>
                                      )}
                                      {idx === m.winnerIndex && (
                                        <Crown
                                          className="h-3 w-3 shrink-0 text-amber-500"
                                          aria-label="Winner"
                                        />
                                      )}
                                    </span>
                                  ))}
                                </div>
                                <p className="mt-2 text-xs text-zinc-600">
                                  Winner:{" "}
                                  <span className="font-semibold text-zinc-900">
                                    {m.winner
                                      ? `${m.winner.name} (${m.winner.color})${winnerIsAi ? " · AI" : ""}`
                                      : "No winner"}
                                  </span>
                                  <span className="text-zinc-400"> · </span>
                                  {m.playerCount} players
                                  <span className="text-zinc-400"> · </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                                    {formatDuration(m.durationMs)}
                                  </span>
                                </p>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-400 transition group-hover:text-zinc-700">
                                Details
                                <ChevronRight
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {visible < filteredMatches.length && (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setVisible((v) => v + PAGE_SIZE)}
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50"
                        >
                          Load more ({filteredMatches.length - visible} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}

        <p className="mt-6 text-center text-xs text-zinc-400">
          History stays in this browser&apos;s local storage (latest 200 matches) — no
          account, no cloud backup, no sync across devices.
        </p>
      </main>
      <Footer />

      <ConfirmDialog
        open={confirmOpen}
        title={
          pendingAction === "discard"
            ? "Discard unreadable history?"
            : "Clear all history?"
        }
        message={
          pendingAction === "discard"
            ? "The saved history data can't be read. Discard it and start with a fresh, empty history? Sound preferences and other settings are not affected."
            : `This permanently deletes all ${matches.length} saved match${matches.length === 1 ? "" : "es"} from this device. Sound preferences and other settings are not affected.`
        }
        confirmLabel={pendingAction === "discard" ? "Discard data" : "Clear history"}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
      />

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-detail-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className="animate-winner-pop max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Match details
                </p>
                <h2
                  id="match-detail-title"
                  className="mt-0.5 text-lg font-bold tracking-tight text-zinc-900"
                >
                  Match #{selected.no}
                </h2>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setSelected(null)}
                aria-label="Close match details"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Date &amp; time</dt>
                <dd className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {formatMatchDate(selected.endedAt)}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Game mode</dt>
                <dd className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {modeLabel(selected.mode)}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Duration</dt>
                <dd className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {formatDuration(selected.durationMs)}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
                <dt className="text-[11px] font-medium text-zinc-500">Players</dt>
                <dd className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {selected.playerCount} players
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Participants
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {selected.players.map((p, idx) => (
                  <li key={`detail-${idx}`} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow"
                      style={{ backgroundColor: colorHex(p.color) }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-zinc-800">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">{p.color}</span>
                    <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {p.isAi ? `AI${p.difficulty ? ` · ${p.difficulty}` : ""}` : "Human"}
                    </span>
                    {idx === selected.localIndex && (
                      <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        You
                      </span>
                    )}
                    {idx === selected.winnerIndex && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                        Winner
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 p-3">
              <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                Winner:
                <span className="font-semibold text-zinc-900">
                  {selected.winner
                    ? `${selected.winner.name} (${selected.winner.color})`
                    : "No identifiable winner"}
                </span>
                {selected.winner && (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: colorHex(selected.winner.color) }}
                    aria-hidden="true"
                  />
                )}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                Result for{" "}
                <span className="font-semibold text-zinc-900">
                  {selected.localIndex >= 0
                    ? selected.players[selected.localIndex].name
                    : "local player"}
                </span>
                <ResultBadge result={selected.result} />
              </p>
              <p className="mt-2 break-all text-[11px] text-zinc-400">
                Match ID: {selected.id}
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
