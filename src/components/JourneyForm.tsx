"use client";

import { useState } from "react";
import LocationInput, { LocationValue } from "./LocationInput";
import DateTimeInput from "./DateTimeInput";
import RoutingOptionsForm, { RoutingOptions } from "./RoutingOptionsForm";
import { ValidationError, RequestHistoryEntry } from "@/lib/types";
import { RoutingError } from "@/lib/routing";

interface JourneyFormProps {
  start: LocationValue;
  destination: LocationValue;
  onStartChange: (value: LocationValue) => void;
  onDestinationChange: (value: LocationValue) => void;
  // FR6: Lifted state
  dateTime: string;
  onDateTimeChange: (value: string) => void;
  routingOptions: RoutingOptions;
  onRoutingOptionsChange: (value: RoutingOptions) => void;
  validationErrors: ValidationError[];
  isLoading: boolean;
  onSubmit: () => void; // FR6.1: Start routing request
  routingError: RoutingError | null; // FR6: API error feedback
  // Request history
  requestHistory: RequestHistoryEntry[];
  onLoadRequest: (entry: RequestHistoryEntry) => void;
  onClearHistory: () => void;
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

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function JourneyForm({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  dateTime,
  onDateTimeChange,
  routingOptions,
  onRoutingOptionsChange,
  validationErrors,
  isLoading,
  onSubmit,
  routingError,
  requestHistory,
  onLoadRequest,
  onClearHistory,
}: JourneyFormProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  // Helper to get error for a field
  const getFieldError = (field: ValidationError["field"]): string | undefined => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  // FR4.9: Swap start and destination
  const handleSwap = () => {
    const tempStart = start;
    onStartChange(destination);
    onDestinationChange(tempStart);
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all request history?")) {
      onClearHistory();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <LocationInput
        label="Start"
        value={start}
        onChange={onStartChange}
        placeholder="Enter start location"
        required
        error={getFieldError("start")}
      />

      {/* FR4.9: Swap button */}
      <div className="flex justify-center -my-1">
        <button
          type="button"
          onClick={handleSwap}
          disabled={isLoading}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all hover:scale-110 active:scale-95 hover:border-lvb-yellow/50 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
          title="Swap start and destination"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <LocationInput
        label="Destination"
        value={destination}
        onChange={onDestinationChange}
        placeholder="Enter destination"
        required
        error={getFieldError("destination")}
      />
      <DateTimeInput
        label="Date & Time"
        value={dateTime}
        onChange={onDateTimeChange}
        required
        error={getFieldError("dateTime")}
      />

      {/* FR6.4-6.5: Collapsible request history panel */}
      {requestHistory.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lvb-yellow"
          >
            {/* Chevron */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${historyOpen ? "rotate-90" : ""}`}
            >
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            {/* Clock icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-400">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">History</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
              {requestHistory.length}
            </span>
            {/* Spacer + trash button */}
            <span className="flex-1" />
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
              className="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Clear history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </span>
          </button>

          {historyOpen && (
            <div className="max-h-48 overflow-y-auto animate-collapsible-open">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                {requestHistory.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onLoadRequest(entry)}
                      title={`${entry.start.text} → ${entry.destination.text}`}
                      className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lvb-yellow"
                    >
                      <div className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                        {entry.displayLabel}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-zinc-400">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase font-medium">
                          {entry.selectedEnvironment}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* FR5: Routing Options */}
      <RoutingOptionsForm
        value={routingOptions}
        onChange={onRoutingOptionsChange}
        error={getFieldError("travelModes")}
      />

      {/* FR6.1: Start Routing Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full mt-2 px-4 py-3 text-sm font-semibold text-lvb-dark bg-lvb-yellow hover:bg-lvb-yellow-hover disabled:bg-lvb-yellow/60 disabled:cursor-not-allowed rounded-xl shadow-[0_2px_8px_0_rgb(251,193,15,0.35)] hover:shadow-[0_4px_12px_0_rgb(251,193,15,0.45)] active:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:ring-offset-2 dark:focus:ring-offset-zinc-900 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-lvb-dark/30 border-t-lvb-dark rounded-full animate-spin" aria-hidden="true" />
            <span>Requesting...</span>
          </>
        ) : (
          <span>Start Routing</span>
        )}
      </button>

      {/* FR6: API error feedback */}
      {routingError && (
        <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-medium">Request failed</div>
            <div className="text-xs mt-1">{routingError.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
