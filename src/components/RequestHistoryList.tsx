"use client";

// FR6.4-6.5: Request history list component

import { RequestHistoryEntry } from "@/lib/types";

interface RequestHistoryListProps {
  history: RequestHistoryEntry[];
  onLoad: (entry: RequestHistoryEntry) => void;
  onClear: () => void;
}

// Format timestamp as relative time or short date
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  // Older than a week: show date
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RequestHistoryList({
  history,
  onLoad,
  onClear,
}: RequestHistoryListProps) {
  const handleClear = () => {
    if (window.confirm("Clear all request history?")) {
      onClear();
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Request History
        </h3>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          title="Clear history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* History list */}
      <ul className="flex flex-col gap-1">
        {history.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onLoad(entry)}
              title={`${entry.start.text} → ${entry.destination.text}`}
              className="w-full p-2 text-left rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {entry.displayLabel}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                  {entry.selectedEnvironment.toUpperCase()}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
