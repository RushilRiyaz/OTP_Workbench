"use client";

import type { Itinerary, TransitLeg } from "@/lib/api/routing";
import {
  MODE_LABELS,
  formatTimestamp,
  formatDuration,
  getLegColor,
  getUniqueProducts,
} from "@/lib/utils/legUtils";
import { ComparisonCardShell } from "./ComparisonCardShell";

// FR15.2/15.3/FR17: Vertical stop-chain diagram strip
export function VerticalTransferSchemeStrip({
  itinerary,
  envId,
  itineraryIndex,
  y,
  height,
  envColor,
  isDark,
  isHovered,
  selectedSlotIndex,
  onHover,
  onSelect,
  onHoverLeg,
}: {
  itinerary: Itinerary;
  envId: string;
  itineraryIndex: number;
  y: number;
  height: number;
  envColor: string;
  isDark: boolean;
  isHovered: boolean;
  /** -1 = not selected, 0/1/2 = slot index in detail comparison */
  selectedSlotIndex: number;
  onHover?: (envId: string, itineraryIndex: number | null) => void;
  onSelect?: (envId: string, itineraryIndex: number) => void;
  onHoverLeg?: (index: number | null) => void;
}) {
  const walkColor = isDark ? "#888888" : "#999999";
  const totalDuration = itinerary.duration || 1;
  const isSelected = selectedSlotIndex >= 0;

  const depTime = itinerary.startTimeHHMM ?? formatTimestamp(itinerary.startTime);
  const arrTime = itinerary.endTimeHHMM ?? formatTimestamp(itinerary.endTime);
  const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);
  const products = getUniqueProducts(itinerary.legs);

  const HEADER_HEIGHT = 24;
  const FOOTER_HEIGHT = 24;
  const contentHeight = Math.max(height - HEADER_HEIGHT - FOOTER_HEIGHT, 12);

  // Build flattened stop chain: board stops, intermediate stops, alight stop
  type StopEntry = {
    name: string;
    time: number;
    color: string;
    isWalk: boolean;
    indicator: "board" | "intermediate" | "alight";
    legIndex: number;
  };

  const stops: StopEntry[] = [];
  itinerary.legs.forEach((leg, legIdx) => {
    const isWalk = !leg.transitLeg;
    const color = isWalk ? walkColor : getLegColor(leg);
    const fromTime = leg.startTime;

    // Add boarding stop (skip if same as previous leg's alighting stop)
    const prevStop = stops[stops.length - 1];
    const fromName = leg.from.name;
    if (!prevStop || prevStop.name !== fromName) {
      stops.push({ name: fromName, time: fromTime, color, isWalk, indicator: "board", legIndex: legIdx });
    } else {
      // Update color for the transfer point to the new leg's color
      prevStop.color = color;
      prevStop.isWalk = isWalk;
      prevStop.indicator = "board";
    }

    // Add intermediate stops for transit legs
    if (leg.transitLeg && leg.intermediateStops) {
      for (const intStop of leg.intermediateStops) {
        const intTime = intStop.departure ?? intStop.arrival ?? leg.startTime;
        stops.push({ name: intStop.name, time: intTime, color, isWalk: false, indicator: "intermediate", legIndex: legIdx });
      }
    }

    // Add alighting stop for the last leg
    if (legIdx === itinerary.legs.length - 1) {
      stops.push({ name: leg.to.name, time: leg.endTime, color, isWalk, indicator: "alight", legIndex: legIdx });
    }
  });

  // Compute Y positions for each stop within the content area
  const itStart = itinerary.startTime;
  const stopPositions = stops.map((s) => {
    const pct = totalDuration > 0 ? (s.time - itStart) / (totalDuration * 1000) : 0;
    return Math.max(0, Math.min(1, pct)) * contentHeight;
  });
  // Enforce minimum gap of 4px between stops
  for (let i = 1; i < stopPositions.length; i++) {
    if (stopPositions[i] - stopPositions[i - 1] < 4) {
      stopPositions[i] = stopPositions[i - 1] + 4;
    }
  }

  return (
    <ComparisonCardShell
      isSelected={isSelected}
      isHovered={isHovered}
      selectedSlotIndex={selectedSlotIndex}
      envColor={envColor}
      className="absolute left-1 right-1 overflow-hidden"
      style={{ top: y, height }}
      onMouseEnter={() => onHover?.(envId, itineraryIndex)}
      onMouseLeave={() => onHover?.(envId, null)}
      onClick={() => onSelect?.(envId, itineraryIndex)}
    >
      {/* Strip content */}
      <div style={{ height: "100%" }} className="flex flex-col pl-1.5 pr-1">
        {/* Departure time header */}
        <div className="flex-shrink-0 flex items-center justify-between px-1" style={{ height: HEADER_HEIGHT }}>
          <span className="font-mono tabular-nums text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
            {depTime}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{duration}</span>
        </div>

        {/* FR15.2: Vertical stop-chain diagram */}
        <div
          className="flex-shrink-0 relative"
          style={{ height: contentHeight }}
        >
          {stops.map((stop, i) => {
            const top = stopPositions[i];
            const nextTop = i < stops.length - 1 ? stopPositions[i + 1] : null;
            const connectorHeight = nextTop !== null ? nextTop - top : 0;
            const nextStop = i < stops.length - 1 ? stops[i + 1] : null;

            // Dot size: board = 8px filled, intermediate = 5px filled, alight = 8px ring
            const dotSize = stop.indicator === "intermediate" ? 5 : 8;
            const isAlight = stop.indicator === "alight";

            // Show route name on connector if enough space
            const showRouteName = connectorHeight >= 18 && !stop.isWalk &&
              itinerary.legs[stop.legIndex]?.transitLeg &&
              (itinerary.legs[stop.legIndex] as TransitLeg).routeShortName;

            return (
              <div key={i} className="absolute left-0 right-0" style={{ top }}>
                {/* Stop dot + name row */}
                <div className="flex items-center gap-2">
                  {/* Dot */}
                  <div
                    className="flex-shrink-0 rounded-full"
                    style={{
                      width: dotSize,
                      height: dotSize,
                      backgroundColor: isAlight ? "transparent" : stop.color,
                      border: isAlight ? `2px solid ${stop.color}` : "none",
                      marginLeft: stop.indicator === "intermediate" ? 1.5 : 0,
                    }}
                  />
                  {/* Stop name (only for board/alight stops to avoid clutter) */}
                  {stop.indicator !== "intermediate" && (
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate leading-none">
                      {stop.name}
                    </span>
                  )}
                </div>

                {/* Connector line to next stop */}
                {connectorHeight > 0 && nextStop && (
                  <div
                    className="absolute"
                    style={{
                      left: 3,
                      top: dotSize + 1,
                      width: 2.5,
                      height: Math.max(connectorHeight - dotSize - 1, 0),
                      backgroundColor: stop.isWalk ? undefined : stop.color,
                      borderLeft: stop.isWalk ? `2px dashed ${walkColor}` : undefined,
                      opacity: stop.isWalk ? 0.5 : 1,
                    }}
                    title={`${MODE_LABELS[itinerary.legs[stop.legIndex]?.mode] ?? itinerary.legs[stop.legIndex]?.mode}`}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverLeg?.(stop.legIndex); }}
                    onMouseLeave={(e) => { e.stopPropagation(); onHoverLeg?.(null); }}
                  >
                    {/* Route name label alongside connector */}
                    {showRouteName && (
                      <span
                        className="absolute text-[9px] font-semibold truncate leading-none"
                        style={{
                          left: 8,
                          top: Math.max((connectorHeight - dotSize - 1) / 2 - 5, 0),
                          color: stop.color,
                        }}
                      >
                        {(itinerary.legs[stop.legIndex] as TransitLeg).routeShortName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Arrival time + products footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-1" style={{ height: FOOTER_HEIGHT }}>
          <span className="font-mono tabular-nums text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
            {arrTime}
          </span>
          <div className="flex items-center gap-0.5">
            {products.slice(0, 2).map((p, i) => (
              <span
                key={i}
                className="px-1 py-0.5 rounded text-[9px] text-white font-medium leading-tight"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

    </ComparisonCardShell>
  );
}
