"use client";

import { useTranslations } from "next-intl";
import { useIsDark } from "@/lib/useIsDark";
import {
  computeTimelineRange,
  computeTotalHeight,
  generateHourMarkers,
  computeAlignedPositions,
  DEFAULT_PIXELS_PER_MINUTE,
  TimelineConfig,
} from "@/lib/timelineUtils";
import type { TimelineComparisonLayoutProps } from "@/lib/types";
import { ENV_COLORS, getEnvLabel } from "@/lib/types";
import { ComparisonEmptyState } from "./ComparisonEmptyState";
import { TimeAxis } from "./TimeAxis";
import { EnvColumn } from "./EnvColumn";

// Unified timeline comparison layout — replaces TimelineComparisonLayout + VerticalTimelineComparisonLayout
export function TimelineComparisonLayout({
  mode,
  comparisonResults,
  selectedEnvironments,
  customEnvironments,
  comparisonHoveredItinerary,
  comparisonSelectedItineraries,
  onComparisonHover,
  onComparisonToggleSelect,
  onComparisonHoverLeg,
}: TimelineComparisonLayoutProps & { mode: "horizontal" | "vertical" }) {
  const t = useTranslations("Comparison");
  const hasAnyResults = Object.keys(comparisonResults).length > 0;
  const isDark = useIsDark();

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

  // Compute timeline range and config
  const timelineRange = computeTimelineRange(comparisonResults, envIds);
  const config: TimelineConfig = {
    timelineStart: timelineRange.start,
    timelineEnd: timelineRange.end,
    pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
  };
  const totalHeight = computeTotalHeight(config);
  const hourMarkers = generateHourMarkers(config);

  // Check if all envs have no itineraries
  const totalItineraryCount = envIds.reduce((sum, id) => {
    return sum + (comparisonResults[id]?.result?.plan?.itineraries?.length ?? 0);
  }, 0);

  if (totalItineraryCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("noItineraries")}</p>
      </div>
    );
  }

  // Compute cross-column aligned positions
  const columnPositions = computeAlignedPositions(
    envIds.map((envId) => ({
      envId,
      itineraries: [...(comparisonResults[envId]?.result?.plan?.itineraries ?? [])]
        .sort((a, b) => a.startTime - b.startTime),
    })),
    config,
    mode,
  );

  // Effective height may exceed computeTotalHeight if overlap prevention pushes cards down
  let maxPositionBottom = 0;
  for (const envId of envIds) {
    for (const p of columnPositions[envId] ?? []) {
      maxPositionBottom = Math.max(maxPositionBottom, p.y + p.height);
    }
  }
  const effectiveHeight = Math.max(totalHeight, maxPositionBottom + 40, 200);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Fixed column headers */}
      <div className="flex-shrink-0 flex border-b border-zinc-200 dark:border-zinc-800">
        {/* Time axis header */}
        <div className="w-14 flex-shrink-0 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t("time")}</span>
        </div>
        {/* Env column headers */}
        {envIds.map((envId, i) => {
          const label = getEnvLabel(envId, customEnvironments);
          const count = comparisonResults[envId]?.result?.plan?.itineraries?.length ?? 0;
          return (
            <div
              key={envId}
              className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: ENV_COLORS[i] ?? "#888" }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {label}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  ({count})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single scrollable container — all columns scroll together */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: effectiveHeight }}>
          {/* Time axis column */}
          <TimeAxis hourMarkers={hourMarkers} totalHeight={effectiveHeight} />

          {/* Environment columns */}
          {envIds.map((envId, envIndex) => (
            <EnvColumn
              key={envId}
              mode={mode}
              envId={envId}
              envIndex={envIndex}
              comparisonResults={comparisonResults}
              config={config}
              totalHeight={effectiveHeight}
              hourMarkers={hourMarkers}
              isDark={isDark}
              hoveredItinerary={comparisonHoveredItinerary}
              selectedItineraries={comparisonSelectedItineraries}
              onHover={onComparisonHover}
              onSelect={onComparisonToggleSelect}
              onHoverLeg={onComparisonHoverLeg}
              precomputedPositions={columnPositions[envId]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
