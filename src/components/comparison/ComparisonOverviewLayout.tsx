"use client";

import { useTranslations } from "next-intl";
import { useIsDark } from "@/lib/useIsDark";
import type { Itinerary } from "@/lib/routing";
import { computeTimelineRange, floorToMinute } from "@/lib/timelineUtils";
import {
  MODE_LABELS,
  formatTimestamp,
  formatDuration,
  getLegColor,
  getUniqueProducts,
} from "@/lib/legUtils";
import type { TimelineComparisonLayoutProps } from "./types";
import { ENV_COLORS, ITINERARY_COLORS, getEnvLabel } from "./types";
import { ComparisonEmptyState } from "./ComparisonEmptyState";

// --- FR13.3 + FR16: Horizontal overview — Gantt-chart timeline with env color coding ---

export function ComparisonOverviewLayout({
  comparisonResults,
  selectedEnvironments,
  customEnvironments,
  comparisonHoveredItinerary,
  comparisonSelectedItineraries,
  onComparisonHover,
  onComparisonToggleSelect,
  onComparisonHoverLeg,
}: TimelineComparisonLayoutProps) {
  const t = useTranslations("Comparison");
  const tCard = useTranslations("ItineraryCard");
  const isDark = useIsDark();
  const hasAnyResults = Object.keys(comparisonResults).length > 0;

  if (!hasAnyResults) {
    return <ComparisonEmptyState selectedEnvironments={selectedEnvironments} />;
  }

  const envIds = selectedEnvironments.filter((id) => comparisonResults[id]);

  // Check if any env is still loading
  const anyLoading = envIds.some((id) => comparisonResults[id].isLoading);
  if (anyLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-lvb-yellow rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{t("loadingResults")}</p>
        </div>
      </div>
    );
  }

  // FR16.1: Merge all itineraries into a single list, tagged with env info
  // Track the original index within each environment for hover/select callbacks
  const mergedItineraries: { envId: string; envIndex: number; itinerary: Itinerary; label: string; originalIndex: number }[] = [];
  envIds.forEach((envId, envIndex) => {
    const entry = comparisonResults[envId];
    if (entry.result?.plan?.itineraries) {
      const label = getEnvLabel(envId, customEnvironments);
      entry.result.plan.itineraries.forEach((itinerary, originalIndex) => {
        mergedItineraries.push({ envId, envIndex, itinerary, label, originalIndex });
      });
    }
  });

  // Sort by departure time
  mergedItineraries.sort((a, b) => a.itinerary.startTime - b.itinerary.startTime);

  if (mergedItineraries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("noItineraries")}</p>
      </div>
    );
  }

  // Compute timeline range from all itineraries
  const { start: timelineStart, end: timelineEnd } = computeTimelineRange(comparisonResults, envIds);
  const timelineSpan = timelineEnd - timelineStart;

  // Generate time axis markers (30-min intervals if ≤3h, else 1h)
  const rangeMinutes = timelineSpan / 60000;
  const intervalMs = rangeMinutes <= 180 ? 30 * 60000 : 60 * 60000;
  const timeMarkers: { label: string; pct: number }[] = [];
  let cursor = timelineStart;
  while (cursor <= timelineEnd) {
    timeMarkers.push({
      label: formatTimestamp(cursor),
      pct: ((cursor - timelineStart) / timelineSpan) * 100,
    });
    cursor += intervalMs;
  }

  const BAR_HEIGHT = 54;
  const BAR_GAP = 6;
  const PADDING_TOP = 6;
  const totalChartHeight = PADDING_TOP + mergedItineraries.length * (BAR_HEIGHT + BAR_GAP) + 4;
  const walkColor = isDark ? "#ffffff" : "#1a1a1a";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* FR16.3: Legend header — color-coded env columns (matches Figure 6) */}
      <div className="flex-shrink-0 flex">
        {envIds.map((envId, i) => {
          const label = getEnvLabel(envId, customEnvironments);
          const count = comparisonResults[envId].result?.plan?.itineraries?.length ?? 0;
          const hasError = !!comparisonResults[envId].error;
          return (
            <div
              key={envId}
              className="flex-1 px-3 py-1.5 text-center text-xs font-semibold text-white truncate"
              style={{ backgroundColor: ENV_COLORS[i] ?? "#888" }}
            >
              {label} ({hasError ? t("error") : count})
            </div>
          );
        })}
      </div>

      {/* FR16.1: Gantt chart body — scrolls vertically */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="relative mx-5" style={{ minHeight: totalChartHeight }}>
          {/* Vertical grid lines with time labels at top */}
          {timeMarkers.map((marker, mi) => {
            return (
              <div key={mi} className="absolute top-0" style={{ left: `${marker.pct}%`, height: totalChartHeight }}>
                <div className="absolute border-l border-dashed border-zinc-300 dark:border-zinc-700" style={{ top: 0, height: totalChartHeight }} />
              </div>
            );
          })}

          {/* Itinerary bars — positioned by departure time, sized by duration */}
          {mergedItineraries.map(({ envId, envIndex, itinerary, label, originalIndex }, i) => {
            const leftPct = ((floorToMinute(itinerary.startTime) - timelineStart) / timelineSpan) * 100;
            const widthPct = Math.max(((itinerary.duration * 1000) / timelineSpan) * 100, 5);
            const top = PADDING_TOP + i * (BAR_HEIGHT + BAR_GAP);
            const envColor = ENV_COLORS[envIndex] ?? "#888";
            const totalDuration = itinerary.duration || 1;
            const products = getUniqueProducts(itinerary.legs);

            const depTime = itinerary.startTimeHHMM ?? formatTimestamp(itinerary.startTime);
            const arrTime = itinerary.endTimeHHMM ?? formatTimestamp(itinerary.endTime);
            const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);

            const isHovered = comparisonHoveredItinerary?.envId === envId && comparisonHoveredItinerary?.itineraryIndex === originalIndex;
            const selectedSlotIndex = (comparisonSelectedItineraries ?? []).findIndex(
              (r) => r.envId === envId && r.itineraryIndex === originalIndex
            );
            const isSelected = selectedSlotIndex >= 0;
            const selectionColor = isSelected ? ITINERARY_COLORS[selectedSlotIndex] : undefined;

            return (
              <div
                key={`${envId}-${originalIndex}-${i}`}
                className={`absolute rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-zinc-900 shadow-lg z-30"
                    : isHovered
                    ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-800 shadow-md z-20"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 z-0"
                }`}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  top,
                  height: BAR_HEIGHT,
                  minWidth: 120,
                  borderColor: isSelected ? selectionColor : undefined,
                }}
                onMouseEnter={() => onComparisonHover?.(envId, originalIndex)}
                onMouseLeave={() => onComparisonHover?.(envId, null)}
                onClick={() => onComparisonToggleSelect?.(envId, originalIndex)}
              >
                {/* FR17: Selection badge */}
                {isSelected && (
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-40"
                    style={{ backgroundColor: selectionColor }}
                  >
                    {selectedSlotIndex + 1}
                  </div>
                )}
                {/* FR16.2: Left accent bar showing env color */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: envColor }}
                />

                {/* Content: times, transfer scheme, products */}
                <div className="px-2 py-1 pl-2.5 h-full flex flex-col justify-center overflow-hidden">
                  {/* Row 1: Env label + Times + Duration */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: envColor }}
                    />
                    <span className="font-semibold uppercase text-zinc-400 dark:text-zinc-500 flex-shrink-0">{label}</span>
                    <span className="text-zinc-300 dark:text-zinc-600 flex-shrink-0">|</span>
                    <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-100 flex-shrink-0">{depTime}</span>
                    <svg className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-100 flex-shrink-0">{arrTime}</span>
                    <span className="ml-auto text-zinc-400 dark:text-zinc-500 flex-shrink-0">{duration}</span>
                  </div>

                  {/* Row 2: Transfer scheme bar (proportional leg segments) */}
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 my-0.5">
                    {itinerary.legs.map((leg, li) => {
                      const pct = Math.max((leg.duration / totalDuration) * 100, 2);
                      const isWalk = !leg.transitLeg;
                      return (
                        <div
                          key={li}
                          className="h-full"
                          onMouseEnter={() => onComparisonHoverLeg?.(li)}
                          onMouseLeave={() => onComparisonHoverLeg?.(null)}
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

                  {/* Row 3: Product badges + transfers */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {products.map((p, pi) => (
                      <span
                        key={pi}
                        className="px-1 py-0 rounded text-[9px] text-white font-medium leading-tight flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.label} {p.routeName}
                      </span>
                    ))}
                    {itinerary.transfers > 0 && (
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 ml-auto flex-shrink-0">
                        {itinerary.transfers === 1
                          ? tCard("transfer", { count: itinerary.transfers })
                          : tCard("transfers", { count: itinerary.transfers })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time axis — fixed at bottom */}
      <div className="flex-shrink-0 h-8 relative border-t border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 mx-5">
        {timeMarkers.map((marker, mi) => {
          const isFirst = mi === 0;
          const isLast = mi === timeMarkers.length - 1;
          return (
            <span
              key={mi}
              className={`absolute text-xs font-mono font-medium text-zinc-600 dark:text-zinc-300 leading-8 whitespace-nowrap ${
                isFirst ? "translate-x-0" : isLast ? "-translate-x-full" : "-translate-x-1/2"
              }`}
              style={{ left: `${marker.pct}%` }}
            >
              {marker.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
