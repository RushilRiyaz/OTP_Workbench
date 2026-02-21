"use client";

import { useState } from "react";
import type { Itinerary, Leg, TransitLeg } from "@/lib/routing";
import { isStation } from "@/lib/routing";
import { useIsDark } from "@/lib/useIsDark";
import {
  MODE_LABELS,
  MODE_COLORS,
  formatTimestamp,
  formatDuration,
  getLegColor,
  getUniqueProducts,
  formatDelay,
  formatDistance,
} from "@/lib/legUtils";

// --- Leg detail components ---

function WalkLegDetail({ leg }: { leg: Leg }) {
  const isDark = useIsDark();
  const walkColor = isDark ? "#ffffff" : "#1a1a1a";
  const fromStopId = isStation(leg.from) ? leg.from.stopId : undefined;
  const toStopId = isStation(leg.to) ? leg.to.stopId : undefined;

  return (
    <div className="py-1.5 px-2 text-xs" style={{ color: walkColor, opacity: 0.7 }}>
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>{MODE_LABELS[leg.mode] ?? leg.mode} {formatDistance(leg.distance)} ({formatDuration(leg.duration)})</span>
      </div>
      {/* FR11.1: Walk leg from/to with stop IDs */}
      <div className="ml-5.5 mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>{leg.from.name}{fromStopId && <span className="ml-1 font-mono">{fromStopId}</span>}</span>
        <span className="mx-1">&rarr;</span>
        <span>{leg.to.name}{toStopId && <span className="ml-1 font-mono">{toStopId}</span>}</span>
      </div>
    </div>
  );
}

function TransitLegDetail({ leg }: { leg: TransitLeg }) {
  const [expanded, setExpanded] = useState(false);
  const color = getLegColor(leg);
  const label = MODE_LABELS[leg.mode] ?? leg.mode;
  const stopCount = leg.intermediateStops?.length ?? 0;

  const depTime = leg.startTimeHHMM ?? formatTimestamp(leg.startTime);
  const arrTime = leg.endTimeHHMM ?? formatTimestamp(leg.endTime);

  return (
    <div className="text-xs">
      {/* Leg header — clickable to expand */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
      >
        {/* Mode badge */}
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-white font-medium flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {label} {leg.routeShortName}
        </span>

        {/* Direction */}
        <span className="text-zinc-500 dark:text-zinc-400 truncate flex-1">
          &rarr; {leg.headsign}
        </span>

        {/* Stop count + expand chevron */}
        <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0 flex items-center gap-1">
          {stopCount > 0 && <span>{stopCount} stop{stopCount !== 1 ? "s" : ""}</span>}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Expanded: intermediate stops timeline */}
      {expanded && (
        <div className="ml-3 pl-3 border-l-2 mt-1 mb-2" style={{ borderColor: color }}>
          {/* Boarding stop */}
          <StopRow
            name={leg.from.name}
            time={depTime}
            delayedTime={leg.from.departureDelayedTimeHHMM}
            delay={leg.from.departureDelay}
            track={"track" in leg.from ? leg.from.track : undefined}
            scheduledTrack={"scheduledTrack" in leg.from ? leg.from.scheduledTrack : undefined}
            cancelled={"cancelled" in leg.from ? leg.from.cancelled : false}
            color={color}
            indicator="board"
            stopId={leg.from.stopId}
          />

          {/* Intermediate stops */}
          {leg.intermediateStops?.map((stop, i) => (
            <StopRow
              key={i}
              name={stop.name}
              time={stop.departureDelayedTimeHHMM ?? (stop.departure ? formatTimestamp(stop.departure) : undefined)}
              delayedTime={stop.departureDelayedTimeHHMM}
              delay={stop.departureDelay}
              track={stop.track}
              scheduledTrack={stop.scheduledTrack}
              cancelled={stop.cancelled}
              color={color}
              indicator="intermediate"
              stopId={stop.stopId}
            />
          ))}

          {/* Alighting stop */}
          <StopRow
            name={leg.to.name}
            time={arrTime}
            delayedTime={leg.to.arrivalDelayedTimeHHMM}
            delay={leg.to.arrivalDelay}
            track={"track" in leg.to ? leg.to.track : undefined}
            scheduledTrack={"scheduledTrack" in leg.to ? leg.to.scheduledTrack : undefined}
            cancelled={"cancelled" in leg.to ? leg.to.cancelled : false}
            color={color}
            indicator="alight"
            stopId={leg.to.stopId}
          />
        </div>
      )}
    </div>
  );
}

function StopRow({
  name,
  time,
  delayedTime,
  delay,
  track,
  scheduledTrack,
  cancelled,
  color,
  indicator,
  stopId,
}: {
  name: string;
  time?: string;
  delayedTime?: string;
  delay?: number;
  track?: string | null;
  scheduledTrack?: string | null;
  cancelled?: boolean;
  color: string;
  indicator: "board" | "alight" | "intermediate";
  stopId?: string;
}) {
  const delayStr = formatDelay(delay);
  const trackChanged = track && scheduledTrack && track !== scheduledTrack;

  return (
    <div className={`flex items-start gap-2 py-1 relative ${cancelled ? "opacity-50" : ""}`}>
      {/* Timeline dot */}
      <div className="flex-shrink-0 mt-0.5 relative">
        {indicator === "board" || indicator === "alight" ? (
          <div
            className="w-2.5 h-2.5 rounded-full border-2 -ml-[7px]"
            style={{ borderColor: color, backgroundColor: indicator === "board" ? color : "white" }}
          />
        ) : (
          <div
            className="w-1.5 h-1.5 rounded-full -ml-[5px]"
            style={{ backgroundColor: color, opacity: 0.6 }}
          />
        )}
      </div>

      {/* Time */}
      <span className="flex-shrink-0 w-10 text-zinc-600 dark:text-zinc-300 font-mono tabular-nums">
        {time ?? "—"}
      </span>

      {/* Delay indicator */}
      {delayStr && (
        <span className={`flex-shrink-0 font-mono text-[10px] tabular-nums ${
          delayStr.startsWith("+") ? "text-red-500" : "text-green-500"
        }`}>
          {delayStr}
        </span>
      )}

      {/* Stop name + indicators */}
      <div className="flex-1 min-w-0">
        <span className={`${cancelled ? "line-through" : ""} text-zinc-700 dark:text-zinc-300`}>
          {name}
        </span>
        {/* FR11.1/FR11.2: Stop ID */}
        {stopId && (
          <span className="ml-1.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{stopId}</span>
        )}
        {indicator === "board" && (
          <span className="ml-1.5 text-[10px] font-semibold uppercase text-green-600 dark:text-green-400">Board</span>
        )}
        {indicator === "alight" && (
          <span className="ml-1.5 text-[10px] font-semibold uppercase text-red-600 dark:text-red-400">Exit</span>
        )}
        {track && (
          <span className={`ml-1.5 text-[10px] ${trackChanged ? "text-orange-500 font-semibold" : "text-zinc-400 dark:text-zinc-500"}`}>
            Pl. {track}{trackChanged ? ` (was ${scheduledTrack})` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

interface ItineraryCardProps {
  itinerary: Itinerary;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export default function ItineraryCard({ itinerary, index, isSelected, onSelect }: ItineraryCardProps) {
  const isDark = useIsDark();
  const walkColor = isDark ? "#ffffff" : "#1a1a1a";

  const depTime = itinerary.startTimeHHMM ?? formatTimestamp(itinerary.startTime);
  const arrTime = itinerary.endTimeHHMM ?? formatTimestamp(itinerary.endTime);
  const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);
  const products = getUniqueProducts(itinerary.legs);
  const zones = itinerary.zoneInfo?.orderedZones ?? [];
  const shortDistance = itinerary.zoneInfo?.shortDistanceTicket ?? false;

  const totalDuration = itinerary.duration || 1;

  return (
    <div
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
          const isWalk = !leg.transitLeg;
          return (
            <div
              key={i}
              className="h-full"
              style={{
                width: `${pct}%`,
                backgroundColor: isWalk ? walkColor : getLegColor(leg),
                opacity: isWalk ? 0.7 : 1,
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

      {/* Row 5: Expandable leg details (only when selected) */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-0.5">
          {itinerary.legs.map((leg, i) =>
            leg.transitLeg ? (
              <TransitLegDetail key={i} leg={leg} />
            ) : (
              <WalkLegDetail key={i} leg={leg} />
            )
          )}
        </div>
      )}
    </div>
  );
}
