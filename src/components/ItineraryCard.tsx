"use client";

import type { Itinerary, Leg } from "@/lib/routing";

// --- Mode display config ---

const MODE_LABELS: Record<string, string> = {
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

const MODE_COLORS: Record<string, string> = {
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

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getLegColor(leg: Leg): string {
  if (leg.transitLeg && leg.routeColor) {
    const c = leg.routeColor.startsWith("#") ? leg.routeColor : `#${leg.routeColor}`;
    if (c.length >= 4) return c;
  }
  return MODE_COLORS[leg.mode] ?? "#3b82f6";
}

function getUniqueProducts(legs: Leg[]): { mode: string; label: string; routeName?: string; color: string }[] {
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

// --- Component ---

interface ItineraryCardProps {
  itinerary: Itinerary;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export default function ItineraryCard({ itinerary, index, isSelected, onSelect }: ItineraryCardProps) {
  const depTime = itinerary.startTimeHHMM ?? formatTime(itinerary.startTime);
  const arrTime = itinerary.endTimeHHMM ?? formatTime(itinerary.endTime);
  const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);
  const products = getUniqueProducts(itinerary.legs);
  const zones = itinerary.zoneInfo?.orderedZones ?? [];
  const shortDistance = itinerary.zoneInfo?.shortDistanceTicket ?? false;

  // Compute relative widths for the transfer scheme bar
  const totalDuration = itinerary.duration || 1;

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
        isSelected
          ? "border-lvb-yellow bg-yellow-50/60 dark:bg-yellow-950/20 dark:border-yellow-600"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}
    >
      {/* Row 1: Times + Duration */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{depTime}</span>
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{arrTime}</span>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{duration}</span>
      </div>

      {/* Row 2: Transfer scheme bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-2 bg-zinc-100 dark:bg-zinc-800">
        {itinerary.legs.map((leg, i) => {
          const pct = Math.max((leg.duration / totalDuration) * 100, 2);
          return (
            <div
              key={i}
              className="h-full"
              style={{
                width: `${pct}%`,
                backgroundColor: getLegColor(leg),
                opacity: leg.mode === "WALK" ? 0.5 : 1,
              }}
              title={`${MODE_LABELS[leg.mode] ?? leg.mode}${leg.transitLeg ? ` ${leg.routeShortName}` : ""}`}
            />
          );
        })}
      </div>

      {/* Row 3: Transfers + Products */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">
          {itinerary.transfers === 0
            ? "Direct"
            : `${itinerary.transfers} transfer${itinerary.transfers > 1 ? "s" : ""}`}
        </span>

        {products.length > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <div className="flex items-center gap-1.5">
              {products.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white font-medium"
                  style={{ backgroundColor: p.color }}
                >
                  {p.label} {p.routeName}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Row 4: Zones + Short distance */}
      {(zones.length > 0 || shortDistance) && (
        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {zones.length > 0 && <span>Zones: {zones.join(", ")}</span>}
          {shortDistance && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium">
              Short distance
            </span>
          )}
        </div>
      )}
    </button>
  );
}
