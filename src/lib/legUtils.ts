// Shared leg display utilities extracted from ItineraryCard

import type { Leg } from "@/lib/routing";

// --- Mode display config ---

export const MODE_LABELS: Record<string, string> = {
  WALK: "Walk",
  BUS: "Bus",
  TRAM: "Tram",
  SUBURB: "S-Bahn",
  TRAIN: "Train",
  BIKE: "Bike",
  BIKERENTAL: "Bike",
  SUBWAY: "U-Bahn",
  FERRY: "Ferry",
  FLEXA: "Flexa",
};

export const MODE_COLORS: Record<string, string> = {
  WALK: "#9ca3af",
  BUS: "#7c3aed",
  TRAM: "#dc2626",
  SUBURB: "#16a34a",
  TRAIN: "#1e3a5f",
  BIKE: "#ea580c",
  BIKERENTAL: "#ea580c",
  SUBWAY: "#2563eb",
  FERRY: "#0891b2",
  FLEXA: "#d97706",
};

// --- Helpers ---

/** Format epoch ms → HH:mm in Europe/Berlin */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

/** Format seconds → "Xmin" or "Xh Ymin" */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Get leg color from routeColor or fallback to mode color */
export function getLegColor(leg: Leg): string {
  if (leg.transitLeg && leg.routeColor) {
    const c = leg.routeColor.startsWith("#") ? leg.routeColor : `#${leg.routeColor}`;
    if (c.length >= 4) return c;
  }
  return MODE_COLORS[leg.mode] ?? "#3b82f6";
}

/** Extract unique transit products from legs */
export function getUniqueProducts(legs: Leg[]): { mode: string; label: string; routeName?: string; color: string }[] {
  const seen = new Set<string>();
  const products: { mode: string; label: string; routeName?: string; color: string }[] = [];

  for (const leg of legs) {
    if (!leg.transitLeg) continue;
    const key = `${leg.mode}-${leg.routeShortName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      mode: leg.mode,
      label: MODE_LABELS[leg.mode] ?? leg.mode,
      routeName: leg.routeShortName,
      color: getLegColor(leg),
    });
  }
  return products;
}

/** Format delay in seconds → "+X" / "-X" (minutes) or null if no significant delay */
export function formatDelay(delaySeconds: number | undefined): string | null {
  if (delaySeconds === undefined || delaySeconds === 0) return null;
  const mins = Math.round(delaySeconds / 60);
  if (mins === 0) return null;
  return mins > 0 ? `+${mins}` : `${mins}`;
}

/** Format distance in meters → "X.X km" or "X m" */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

/** Alert category labels */
const ALERT_CATEGORIES: Record<number, string> = {
  0: "Disruption",
  1: "Delay",
  2: "Winter",
  3: "Info",
  4: "Construction",
  5: "Event",
  6: "Unreachable",
};

/** Get human-readable alert category label */
export function formatAlertCategory(category: number): string {
  return ALERT_CATEGORIES[category] ?? "Unknown";
}
