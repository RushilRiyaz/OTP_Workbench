"use client";

import type { Itinerary } from "@/lib/routing";
import ItineraryCard from "../ItineraryCard";
import {
  MODE_LABELS,
  formatTimestamp,
  formatDuration,
  getLegColor,
  getUniqueProducts,
} from "@/lib/legUtils";

// FR14.4/14.5/14.6: Compact transfer scheme bar positioned on the timeline
export function TimelineTransferScheme({
  itinerary,
  envId,
  itineraryIndex,
  y,
  envColor,
  isDark,
  isHovered,
  isSelected,
  onHover,
  onSelect,
  onHoverLeg,
}: {
  itinerary: Itinerary;
  envId: string;
  itineraryIndex: number;
  y: number;
  envColor: string;
  isDark: boolean;
  isHovered: boolean;
  isSelected: boolean;
  onHover?: (envId: string, itineraryIndex: number | null) => void;
  onSelect?: (envId: string, itineraryIndex: number) => void;
  onHoverLeg?: (index: number | null) => void;
}) {
  const walkColor = isDark ? "#ffffff" : "#1a1a1a";
  const totalDuration = itinerary.duration || 1;

  const depTime = itinerary.startTimeHHMM ?? formatTimestamp(itinerary.startTime);
  const arrTime = itinerary.endTimeHHMM ?? formatTimestamp(itinerary.endTime);
  const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);
  const products = getUniqueProducts(itinerary.legs);

  return (
    <div
      className={`absolute left-1 right-1 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "border-lvb-yellow bg-yellow-50 dark:bg-zinc-900 shadow-lg z-30"
          : isHovered
          ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-800 shadow-sm z-10"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 z-0"
      }`}
      style={{ top: y }}
      onMouseEnter={() => onHover?.(envId, itineraryIndex)}
      onMouseLeave={() => onHover?.(envId, null)}
      onClick={() => onSelect?.(envId, itineraryIndex)}
    >
      {/* Left accent bar showing env color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
        style={{ backgroundColor: envColor }}
      />

      {/* Compact view: time + transfer scheme + products */}
      <div className="px-2 py-1.5 pl-2.5">
        {/* Times + duration */}
        <div className="flex items-center gap-1.5 text-[10px] mb-1">
          <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-100">
            {depTime}
          </span>
          <svg className="w-2.5 h-2.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-100">
            {arrTime}
          </span>
          <span className="ml-auto text-zinc-400 dark:text-zinc-500">{duration}</span>
        </div>

        {/* FR14.4: Transfer scheme bar (proportional leg segments) */}
        <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {itinerary.legs.map((leg, i) => {
            const pct = Math.max((leg.duration / totalDuration) * 100, 2);
            const isWalk = !leg.transitLeg;
            return (
              <div
                key={i}
                className="h-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isWalk ? walkColor : getLegColor(leg),
                  opacity: isWalk ? 0.5 : 1,
                }}
                title={`${MODE_LABELS[leg.mode] ?? leg.mode}${leg.transitLeg ? ` ${leg.routeShortName}` : ""}`}
              />
            );
          })}
        </div>

        {/* Product badges */}
        {products.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {products.map((p, i) => (
              <span
                key={i}
                className="px-1 py-0 rounded text-[9px] text-white font-medium leading-tight"
                style={{ backgroundColor: p.color }}
              >
                {p.label} {p.routeName}
              </span>
            ))}
            {itinerary.transfers > 0 && (
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 ml-auto">
                {itinerary.transfers} transfer{itinerary.transfers > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* FR14.6: Expanded detail view when selected (click to open) */}
      {isSelected && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 bg-yellow-50 dark:bg-zinc-900">
          <ItineraryCard
            itinerary={itinerary}
            index={itineraryIndex}
            isSelected={true}
            onSelect={() => {}}
            onHoverLeg={onHoverLeg}
          />
        </div>
      )}
    </div>
  );
}
