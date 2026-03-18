"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { NearbySearchItem } from "@/lib/api/nearbySearch";
import { categorizeItem, getStationCount } from "@/lib/api/nearbySearch";
import JsonHighlighted from "../shared/JsonHighlighted";

// FR24.1: Marker colors matching map markers
const CATEGORY_COLORS: Record<string, string> = {
  bike: "#1e3a5f",
  bike_station: "#1e3a5f",
  escooter: "#c026d3",
  escooter_station: "#c026d3",
  mobistation: "#0d9488",
  other: "#b8860b",
};

interface NearbySearchResultsProps {
  results: NearbySearchItem[] | null;
  selectedItem: NearbySearchItem | null;
  onSelectItem: (item: NearbySearchItem | null) => void;
}

export default function NearbySearchResults({
  results,
  selectedItem,
  onSelectItem,
}: NearbySearchResultsProps) {
  const t = useTranslations("NearbySearch");
  const [viewMode, setViewMode] = useState<"list" | "json">("list");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  if (!results) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("noResultsYet")}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {t("submitToSee")}
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("noResults")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header: result count + view toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {t("results", { count: results.length })}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setViewMode("list"); onSelectItem(null); }}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-lvb-yellow/15 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("results", { count: results.length })}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("json")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === "json"
                ? "bg-lvb-yellow/15 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("json")}
          </button>
        </div>
      </div>

      {/* FR25.2: JSON view for entire result */}
      {viewMode === "json" && (
        <div className="flex-1 overflow-auto min-h-0 p-3">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() =>
                handleCopy(JSON.stringify(results, null, 2), "full")
              }
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {copied === "full" ? t("copied") : t("copy")}
            </button>
          </div>
          <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <JsonHighlighted json={JSON.stringify(results, null, 2)} />
          </pre>
        </div>
      )}

      {/* FR24.1: List view with colored dots */}
      {viewMode === "list" && !selectedItem && (
        <div className="flex-1 overflow-auto min-h-0">
          {results.map((item) => {
            const category = categorizeItem(item);
            const count = getStationCount(item);
            const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
              >
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center text-[6px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {count !== null && count > 0 ? "" : ""}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {item.type} &middot; {item.source}
                    {count !== null ? ` &middot; ${count}` : ""}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-zinc-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* FR25.1: Selected item detail + JSON */}
      {viewMode === "list" && selectedItem && (
        <div className="flex-1 overflow-auto min-h-0 p-3">
          {/* Back button */}
          <button
            type="button"
            onClick={() => onSelectItem(null)}
            className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-3"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("results", { count: results.length })}
          </button>

          {/* Item header */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedItem.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {selectedItem.type} &middot; {selectedItem.source} &middot;{" "}
              {selectedItem.provider}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              {selectedItem.id}
            </p>
          </div>

          {/* Copy button */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  JSON.stringify(selectedItem, null, 2),
                  selectedItem.id
                )
              }
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {copied === selectedItem.id
                ? t("copied")
                : t("copyObjectJson")}
            </button>
          </div>

          {/* Full JSON */}
          <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <JsonHighlighted json={JSON.stringify(selectedItem, null, 2)} />
          </pre>
        </div>
      )}
    </div>
  );
}
