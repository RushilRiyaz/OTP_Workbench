"use client";

import { useTranslations } from "next-intl";
import type { Itinerary } from "@/lib/api/routing";
import {
  MODE_LABELS,
  formatTimestamp,
  formatDuration,
  getLegColor,
  getUniqueProducts,
} from "@/lib/utils/legUtils";
import { ComparisonCardShell } from "./ComparisonCardShell";

// FR14.4/14.5/FR17: Compact transfer scheme bar positioned on the timeline
export function TimelineTransferScheme({
  itinerary,
  envId,
  itineraryIndex,
  y,
  envColor,
  isDark,
  isHovered,
  selectedSlotIndex,
  onHover,
  onSelect,
}: {
  itinerary: Itinerary;
  envId: string;
  itineraryIndex: number;
  y: number;
  envColor: string;
  isDark: boolean;
  isHovered: boolean;
  /** -1 = not selected, 0/1/2 = slot index in detail comparison */
  selectedSlotIndex: number;
  onHover?: (envId: string, itineraryIndex: number | null) => void;
  onSelect?: (envId: string, itineraryIndex: number) => void;
}) {
  const tCard = useTranslations("ItineraryCard");
  const walkColor = isDark ? "#ffffff" : "#1a1a1a";
  const totalDuration = itinerary.duration || 1;
  const isSelected = selectedSlotIndex >= 0;

  const depTime = itinerary.startTimeHHMM ?? formatTimestamp(itinerary.startTime);
  const arrTime = itinerary.endTimeHHMM ?? formatTimestamp(itinerary.endTime);
  const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);
  const products = getUniqueProducts(itinerary.legs);

  return (
    <ComparisonCardShell
      isSelected={isSelected}
      isHovered={isHovered}
      selectedSlotIndex={selectedSlotIndex}
      envColor={envColor}
      className="absolute left-1 right-1"
      style={{ top: y }}
      onMouseEnter={() => onHover?.(envId, itineraryIndex)}
      onMouseLeave={() => onHover?.(envId, null)}
      onClick={() => onSelect?.(envId, itineraryIndex)}
    >
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
                {itinerary.transfers === 1
                  ? tCard("transfer", { count: itinerary.transfers })
                  : tCard("transfers", { count: itinerary.transfers })}
              </span>
            )}
          </div>
        )}
      </div>
    </ComparisonCardShell>
  );
}
