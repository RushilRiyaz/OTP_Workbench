"use client";

import { useState, useCallback } from "react";
import type { RoutingResponse } from "@/lib/routing";
import ItineraryCard from "./ItineraryCard";

type ResultsView = "itineraries" | "json";

interface RoutingResultsProps {
  routingResult: RoutingResponse | null;
  selectedIndex: number;
  onSelectItinerary: (index: number) => void;
  onLoadMore?: (direction: "earlier" | "later") => Promise<void>;
}

export default function RoutingResults({
  routingResult,
  selectedIndex,
  onSelectItinerary,
  onLoadMore,
}: RoutingResultsProps) {
  const itineraries = routingResult?.plan?.itineraries ?? [];
  const [view, setView] = useState<ResultsView>("itineraries");
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [loadingLater, setLoadingLater] = useState(false);

  const handleCopyJson = useCallback(async () => {
    if (!routingResult) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(routingResult, null, 2));
      setCopyState("success");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [routingResult]);

  const handleLoadEarlier = useCallback(async () => {
    if (!onLoadMore || loadingEarlier) return;
    setLoadingEarlier(true);
    try { await onLoadMore("earlier"); } finally { setLoadingEarlier(false); }
  }, [onLoadMore, loadingEarlier]);

  const handleLoadLater = useCallback(async () => {
    if (!onLoadMore || loadingLater) return;
    setLoadingLater(true);
    try { await onLoadMore("later"); } finally { setLoadingLater(false); }
  }, [onLoadMore, loadingLater]);

  if (!routingResult || itineraries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="mx-auto w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No routing results yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Submit a routing request to see itineraries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* View toggle header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 flex-shrink-0">
        {/* Segmented control — Apple style */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setView("itineraries")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              view === "itineraries"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Itineraries ({itineraries.length})
          </button>
          <button
            type="button"
            onClick={() => setView("json")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              view === "json"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            JSON
          </button>
        </div>

        {/* Copy JSON button */}
        {view === "json" && (
          <button
            type="button"
            onClick={handleCopyJson}
            disabled={copyState !== "idle"}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-60"
          >
            {copyState === "success" ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : copyState === "error" ? (
              <>
                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Failed</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Content area */}
      {view === "itineraries" ? (
        <div className="flex-1 overflow-y-auto p-3 pt-1 space-y-2">
          {/* Earlier button */}
          {onLoadMore && (
            <button
              type="button"
              onClick={handleLoadEarlier}
              disabled={loadingEarlier || loadingLater}
              className="w-full py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loadingEarlier ? (
                <span className="inline-block w-3 h-3 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {loadingEarlier ? "Loading..." : "Earlier departures"}
            </button>
          )}

          {itineraries.map((itinerary, i) => (
            <ItineraryCard
              key={`${itinerary.startTime}-${itinerary.endTime}-${i}`}
              itinerary={itinerary}
              index={i}
              isSelected={i === selectedIndex}
              onSelect={onSelectItinerary}
            />
          ))}

          {/* Later button */}
          {onLoadMore && (
            <button
              type="button"
              onClick={handleLoadLater}
              disabled={loadingEarlier || loadingLater}
              className="w-full py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loadingLater ? (
                <span className="inline-block w-3 h-3 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {loadingLater ? "Loading..." : "Later departures"}
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3 pt-1">
          <pre className="text-[11px] leading-relaxed font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 overflow-x-auto whitespace-pre">
            <JsonHighlighted json={JSON.stringify(routingResult, null, 2)} />
          </pre>
        </div>
      )}
    </div>
  );
}

// Simple JSON syntax highlighter
function JsonHighlighted({ json }: { json: string }) {
  const lines = json.split("\n");

  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>{highlightLine(line)}</div>
      ))}
    </>
  );
}

function highlightLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const keyMatch = remaining.match(/^(\s*)"([^"]*)"(\s*:)/);
    if (keyMatch) {
      parts.push(<span key={key++}>{keyMatch[1]}</span>);
      parts.push(<span key={key++} className="text-purple-600 dark:text-purple-400">&quot;{keyMatch[2]}&quot;</span>);
      parts.push(<span key={key++}>{keyMatch[3]}</span>);
      remaining = remaining.slice(keyMatch[0].length);
      continue;
    }

    const strMatch = remaining.match(/^"([^"]*)"/);
    if (strMatch) {
      parts.push(<span key={key++} className="text-green-600 dark:text-green-400">&quot;{strMatch[1]}&quot;</span>);
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }

    const numMatch = remaining.match(/^(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/);
    if (numMatch) {
      parts.push(<span key={key++} className="text-blue-600 dark:text-blue-400">{numMatch[1]}</span>);
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    const boolMatch = remaining.match(/^(true|false|null)/);
    if (boolMatch) {
      parts.push(<span key={key++} className="text-orange-600 dark:text-orange-400">{boolMatch[1]}</span>);
      remaining = remaining.slice(boolMatch[0].length);
      continue;
    }

    parts.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
}
