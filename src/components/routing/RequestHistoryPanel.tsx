"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { RequestHistoryEntry } from "@/lib/types";

interface RequestHistoryPanelProps {
  history: RequestHistoryEntry[];
  onLoadRequest: (entry: RequestHistoryEntry) => void;
  onClearHistory: () => void;
}

// Format a datetime-local string (e.g. "2026-02-15T14:30") as "Feb 15, 14:30"
function formatDateTime(dateTime: string): string {
  if (!dateTime) return "—";
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return dateTime;
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hours}:${minutes}`;
}

export default function RequestHistoryPanel({
  history,
  onLoadRequest,
  onClearHistory,
}: RequestHistoryPanelProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmEntryId, setConfirmEntryId] = useState<string | null>(null);
  const t = useTranslations("JourneyForm");

  const handleClearHistory = () => {
    if (window.confirm(t("clearHistoryConfirm"))) {
      onClearHistory();
    }
  };

  if (history.length === 0) return null;

  return (
    <div className={`rounded-xl border transition-colors ${historyOpen ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"}`}>
      {/* Header — matches DisclosurePanel style */}
      <button
        type="button"
        onClick={() => setHistoryOpen((prev) => !prev)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lvb-yellow rounded-xl"
      >
        {/* Icon */}
        <span className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${historyOpen ? "bg-lvb-yellow/15 text-lvb-yellow-dark dark:text-lvb-yellow" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
          </svg>
        </span>

        {/* Label + Badge */}
        <span className="flex-1 flex items-center gap-2 min-w-0">
          <span className={`text-sm font-medium transition-colors ${historyOpen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
            {t("history")}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors ${historyOpen ? "bg-lvb-yellow/20 text-lvb-yellow-dark dark:text-lvb-yellow" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
            {history.length}
          </span>
        </span>

        {/* Clear button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            handleClearHistory();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              handleClearHistory();
            }
          }}
          className="p-1 rounded-md text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title={t("clearHistory")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${historyOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {historyOpen && (
        <div className="px-3 pb-3 pt-0 animate-collapsible-open">
          <div className="border-t border-zinc-200/80 dark:border-zinc-700/60 pt-2.5">
            <div className="max-h-52 overflow-y-auto space-y-1.5">
              {history.map((entry) => (
                <div key={entry.id}>
                  {confirmEntryId === entry.id ? (
                    /* Confirmation prompt */
                    <div className="rounded-lg border border-lvb-yellow/40 bg-lvb-yellow/5 dark:bg-lvb-yellow/10 p-3">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2.5">
                        {t("loadRequest")}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadRequest(entry);
                            setConfirmEntryId(null);
                          }}
                          className="flex-1 px-3 py-2 text-sm font-semibold bg-lvb-yellow hover:bg-lvb-yellow-hover text-lvb-dark rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                        >
                          {t("load")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmEntryId(null)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* History entry card */
                    <button
                      type="button"
                      onClick={() => setConfirmEntryId(entry.id)}
                      className="group w-full rounded-lg border border-zinc-150 dark:border-zinc-700/60 bg-white dark:bg-zinc-800/50 hover:border-lvb-yellow/40 dark:hover:border-lvb-yellow/30 hover:shadow-sm p-2.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                    >
                      {/* Top row: env badge + datetime */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                          {entry.selectedEnvironment}
                        </span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                          {formatDateTime(entry.dateTime)}
                        </span>
                      </div>
                      {/* Route details */}
                      <div className="flex items-start gap-2.5">
                        {/* Dot connector */}
                        <div className="flex flex-col items-center gap-0.5 pt-[5px] shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                          <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-600" />
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate leading-snug">
                            {entry.start.text || "—"}
                          </p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate leading-snug">
                            {entry.destination.text || "—"}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
