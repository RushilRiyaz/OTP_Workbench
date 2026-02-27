// FR14.2: Timeline math utilities for comparison layouts

import type { RoutingResponse } from "./routing";
import { formatTimestamp } from "./legUtils";

export interface TimelineConfig {
  timelineStart: number;   // epoch ms — start of visible range
  timelineEnd: number;     // epoch ms — end of visible range
  pixelsPerMinute: number; // how many px per minute of real time
}

export const DEFAULT_PIXELS_PER_MINUTE = 8;

/**
 * Compute the timeline range from all itineraries across environments.
 * Rounds start down to the previous hour and end up to the next hour.
 */
export function computeTimelineRange(
  comparisonResults: Record<string, { result: RoutingResponse | null }>,
  envIds: string[],
  paddingMinutes: number = 15
): { start: number; end: number } {
  let minTime = Infinity;
  let maxTime = -Infinity;

  for (const envId of envIds) {
    const itineraries = comparisonResults[envId]?.result?.plan?.itineraries ?? [];
    for (const it of itineraries) {
      if (it.startTime < minTime) minTime = it.startTime;
      if (it.endTime > maxTime) maxTime = it.endTime;
    }
  }

  // Fallback if no itineraries found: 1-hour window from now
  if (minTime === Infinity) {
    const now = Date.now();
    const startDate = new Date(now);
    startDate.setMinutes(0, 0, 0);
    return { start: startDate.getTime(), end: startDate.getTime() + 3600000 };
  }

  // Round down to previous hour
  const startDate = new Date(minTime - paddingMinutes * 60000);
  startDate.setMinutes(0, 0, 0);

  // Round up to next hour
  const endDate = new Date(maxTime + paddingMinutes * 60000);
  if (endDate.getMinutes() > 0 || endDate.getSeconds() > 0 || endDate.getMilliseconds() > 0) {
    endDate.setMinutes(60, 0, 0);
  }

  return { start: startDate.getTime(), end: endDate.getTime() };
}

/** Convert epoch ms to Y position in pixels */
export function timeToY(time: number, config: TimelineConfig): number {
  return ((time - config.timelineStart) / 60000) * config.pixelsPerMinute;
}

/** Convert duration (seconds) to height in pixels */
export function durationToHeight(durationSeconds: number, config: TimelineConfig): number {
  return (durationSeconds / 60) * config.pixelsPerMinute;
}

/** Compute total scrollable height for the timeline */
export function computeTotalHeight(config: TimelineConfig): number {
  return ((config.timelineEnd - config.timelineStart) / 60000) * config.pixelsPerMinute;
}

/** Generate hour/half-hour markers for the time axis */
export function generateHourMarkers(
  config: TimelineConfig
): { time: number; label: string; y: number }[] {
  const markers: { time: number; label: string; y: number }[] = [];

  // Use 30-min intervals if range is <= 3 hours, else 1-hour intervals
  const rangeMinutes = (config.timelineEnd - config.timelineStart) / 60000;
  const intervalMs = rangeMinutes <= 180 ? 30 * 60000 : 60 * 60000;

  let t = config.timelineStart;
  while (t <= config.timelineEnd) {
    markers.push({
      time: t,
      label: formatTimestamp(t),
      y: timeToY(t, config),
    });
    t += intervalMs;
  }

  return markers;
}
