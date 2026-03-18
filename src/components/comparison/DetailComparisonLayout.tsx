"use client";

import { useTranslations } from "next-intl";
import ItineraryCard from "../ItineraryCard";
import type { DetailComparisonLayoutProps } from "@/lib/types";
import { ITINERARY_COLORS, getEnvLabel } from "@/lib/types";

// FR17.2: Dedicated detail comparison view — side-by-side columns (1-3)
export function DetailComparisonLayout({
  items,
  comparisonResults,
  customEnvironments,
  onDeselectItem,
  onDeselectAll,
  onHoverLeg,
}: Omit<DetailComparisonLayoutProps, "detailHoveredLeg">) {
  const t = useTranslations("DetailComparison");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sticky toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("title")}
        </span>
        <button
          type="button"
          onClick={onDeselectAll}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("exit")}
        </button>
      </div>

      {/* Columns */}
      <div className="flex-1 flex min-h-0">
        {items.map((ref, colIdx) => {
          const entry = comparisonResults[ref.envId];
          const itinerary = entry?.result?.plan?.itineraries?.[ref.itineraryIndex];
          const color = ITINERARY_COLORS[colIdx];
          const envLabel = getEnvLabel(ref.envId, customEnvironments);

          if (!itinerary) return null;

          return (
            <div
              key={`${ref.envId}-${ref.itineraryIndex}`}
              className="flex-1 flex flex-col min-h-0 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800"
            >
              {/* Column header */}
              <div
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {envLabel}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  #{ref.itineraryIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onDeselectItem(ref)}
                  className="ml-auto p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                  title={t("remove")}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable body — always expanded ItineraryCard */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <ItineraryCard
                  itinerary={itinerary}
                  index={ref.itineraryIndex}
                  isSelected={true}
                  onSelect={() => {}}
                  onHoverLeg={(legIndex) => {
                    if (legIndex === null) {
                      onHoverLeg(null);
                    } else {
                      onHoverLeg({ slotIndex: colIdx, legIndex });
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
