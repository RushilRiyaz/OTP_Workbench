"use client";

import type { RoutingResponse, RoutingError } from "@/lib/routing";
import type { TimelineConfig } from "@/lib/timelineUtils";
import { timeToY, durationToHeight } from "@/lib/timelineUtils";
import { ENV_COLORS } from "./types";
import { TimelineTransferScheme } from "./TimelineTransferScheme";
import { VerticalTransferSchemeStrip } from "./VerticalTransferSchemeStrip";

// Unified env column — replaces TimelineEnvColumn + VerticalTimelineEnvColumn
export function EnvColumn({
  mode,
  envId,
  envIndex,
  comparisonResults,
  config,
  totalHeight,
  hourMarkers,
  isDark,
  hoveredItinerary,
  selectedItinerary,
  onHover,
  onSelect,
  onHoverLeg,
}: {
  mode: "horizontal" | "vertical";
  envId: string;
  envIndex: number;
  comparisonResults: Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }>;
  config: TimelineConfig;
  totalHeight: number;
  hourMarkers: { y: number }[];
  isDark: boolean;
  hoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  selectedItinerary?: { envId: string; itineraryIndex: number } | null;
  onHover?: (envId: string, itineraryIndex: number | null) => void;
  onSelect?: (envId: string, itineraryIndex: number) => void;
  onHoverLeg?: (index: number | null) => void;
}) {
  const entry = comparisonResults[envId];
  const itineraries = entry?.result?.plan?.itineraries ?? [];
  const envColor = ENV_COLORS[envIndex] ?? "#888";

  if (entry?.error) {
    return (
      <div className="flex-1 flex items-center justify-center border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 p-3">
        <div className="text-center">
          <p className="text-xs text-red-500">Error</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 max-w-[150px] truncate">{entry.error.message}</p>
        </div>
      </div>
    );
  }

  // Sort by realtime departure time
  const sorted = [...itineraries]
    .map((it, originalIndex) => ({ itinerary: it, originalIndex }))
    .sort((a, b) => a.itinerary.startTime - b.itinerary.startTime);

  // Compute Y positions with overlap prevention — mode-dependent
  const positions: { y: number; height: number }[] = [];
  let nextAvailableY = 0;

  if (mode === "horizontal") {
    const CARD_HEIGHT = 80;
    const CARD_GAP = 8;
    for (const { itinerary } of sorted) {
      const timeY = timeToY(itinerary.startTime, config);
      const y = Math.max(timeY, nextAvailableY);
      positions.push({ y, height: CARD_HEIGHT });
      nextAvailableY = y + CARD_HEIGHT + CARD_GAP;
    }
  } else {
    const MIN_STRIP_HEIGHT = 60;
    const STRIP_GAP = 4;
    for (const { itinerary } of sorted) {
      const timeY = timeToY(itinerary.startTime, config);
      const rawHeight = durationToHeight(itinerary.duration, config);
      const height = Math.max(rawHeight, MIN_STRIP_HEIGHT);
      const y = Math.max(timeY, nextAvailableY);
      positions.push({ y, height });
      nextAvailableY = y + height + STRIP_GAP;
    }
  }

  return (
    <div
      className="flex-1 relative border-r last:border-r-0 border-zinc-200 dark:border-zinc-800"
      style={{ height: totalHeight }}
    >
      {/* Horizontal gridlines at hour markers */}
      {hourMarkers.map((marker, i) => (
        <div
          key={`grid-${i}`}
          className="absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-800/50 pointer-events-none"
          style={{ top: marker.y }}
        />
      ))}

      {/* Itinerary items — mode-dependent rendering */}
      {sorted.map(({ itinerary, originalIndex }, sortedIdx) => {
        const { y, height } = positions[sortedIdx];
        const isHovered = hoveredItinerary?.envId === envId && hoveredItinerary?.itineraryIndex === originalIndex;
        const isSelected = selectedItinerary?.envId === envId && selectedItinerary?.itineraryIndex === originalIndex;

        return mode === "horizontal" ? (
          <TimelineTransferScheme
            key={`${envId}-${originalIndex}`}
            itinerary={itinerary}
            envId={envId}
            itineraryIndex={originalIndex}
            y={y}
            envColor={envColor}
            isDark={isDark}
            isHovered={isHovered}
            isSelected={isSelected}
            onHover={onHover}
            onSelect={onSelect}
            onHoverLeg={onHoverLeg}
          />
        ) : (
          <VerticalTransferSchemeStrip
            key={`${envId}-${originalIndex}`}
            itinerary={itinerary}
            envId={envId}
            itineraryIndex={originalIndex}
            y={y}
            height={height}
            envColor={envColor}
            isDark={isDark}
            isHovered={isHovered}
            isSelected={isSelected}
            onHover={onHover}
            onSelect={onSelect}
            onHoverLeg={onHoverLeg}
          />
        );
      })}
    </div>
  );
}
