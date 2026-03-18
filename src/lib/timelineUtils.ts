// FR14.2: Timeline math utilities for comparison layouts

import type { RoutingResponse } from "./routing";
import { formatTimestamp } from "./legUtils";

export interface TimelineConfig {
  timelineStart: number;   // epoch ms — start of visible range
  timelineEnd: number;     // epoch ms — end of visible range
  pixelsPerMinute: number; // how many px per minute of real time
}

export const DEFAULT_PIXELS_PER_MINUTE = 8;

// Layout constants shared between position computation and rendering
export const CARD_HEIGHT = 80;
export const CARD_GAP = 8;
export const MIN_STRIP_HEIGHT = 60;
export const STRIP_GAP = 4;

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

/** Floor epoch ms to the start of its minute (zero out seconds + ms) */
export function floorToMinute(epochMs: number): number {
  return epochMs - (epochMs % 60000);
}

/** Convert epoch ms to Y position in pixels (floored to minute for consistent alignment) */
export function timeToY(time: number, config: TimelineConfig): number {
  const floored = floorToMinute(time);
  return ((floored - config.timelineStart) / 60000) * config.pixelsPerMinute;
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

// ---------------------------------------------------------------------------
// Cross-column aligned positioning
// ---------------------------------------------------------------------------

function getItemHeight(durationSeconds: number, config: TimelineConfig, mode: "horizontal" | "vertical"): number {
  if (mode === "horizontal") return CARD_HEIGHT;
  return Math.max(durationToHeight(durationSeconds, config), MIN_STRIP_HEIGHT);
}

/**
 * Compute card positions for all env columns with cross-column alignment.
 * Itineraries starting in the same minute get the same Y across columns,
 * preventing visual misalignment when overlap prevention shifts cards.
 *
 * @param columns - array of { envId, itineraries } where itineraries are already sorted by startTime
 * @param config - TimelineConfig for pixel calculations
 * @param mode - "horizontal" (fixed card height) or "vertical" (duration-based height)
 * @returns map from envId to position array indexed by sorted itinerary index
 */
export function computeAlignedPositions(
  columns: { envId: string; itineraries: { startTime: number; duration: number }[] }[],
  config: TimelineConfig,
  mode: "horizontal" | "vertical",
): Record<string, { y: number; height: number }[]> {
  const gap = mode === "horizontal" ? CARD_GAP : STRIP_GAP;

  // Initialize per-column state
  const result: Record<string, { y: number; height: number }[]> = {};
  const nextAvailableY: Record<string, number> = {};
  for (const col of columns) {
    result[col.envId] = new Array(col.itineraries.length);
    nextAvailableY[col.envId] = 0;
  }

  // Build merged list with minute bucket
  type Entry = { minute: number; envId: string; sortedIdx: number; startTime: number; duration: number };
  const entries: Entry[] = [];
  for (const col of columns) {
    for (let i = 0; i < col.itineraries.length; i++) {
      const it = col.itineraries[i];
      entries.push({
        minute: Math.floor(it.startTime / 60000),
        envId: col.envId,
        sortedIdx: i,
        startTime: it.startTime,
        duration: it.duration,
      });
    }
  }

  // Sort by minute, then envId for stable grouping
  entries.sort((a, b) => a.minute - b.minute || a.envId.localeCompare(b.envId));

  // Process groups by minute bucket
  let i = 0;
  while (i < entries.length) {
    const groupMinute = entries[i].minute;
    const groupStart = i;
    while (i < entries.length && entries[i].minute === groupMinute) i++;
    const group = entries.slice(groupStart, i);

    // Group entries by envId (multiple from same column in same minute → stack)
    const byEnv = new Map<string, Entry[]>();
    for (const entry of group) {
      if (!byEnv.has(entry.envId)) byEnv.set(entry.envId, []);
      byEnv.get(entry.envId)!.push(entry);
    }

    // Find max candidate Y across all columns for this time slot
    let maxY = -Infinity;
    for (const [envId, envEntries] of byEnv) {
      const first = envEntries[0];
      const candidateY = Math.max(timeToY(first.startTime, config), nextAvailableY[envId]);
      if (candidateY > maxY) maxY = candidateY;
    }

    // Place all entries at aligned Y, stacking within same column
    for (const [envId, envEntries] of byEnv) {
      let y = maxY;
      for (const entry of envEntries) {
        const height = getItemHeight(entry.duration, config, mode);
        result[envId][entry.sortedIdx] = { y, height };
        y += height + gap;
      }
      nextAvailableY[envId] = y;
    }
  }

  return result;
}
