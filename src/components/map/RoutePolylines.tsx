"use client";

import { useEffect } from "react";
import { Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { Itinerary } from "@/lib/api/routing";
import { getLegColor } from "@/lib/utils/legUtils";

const DASHED_MODES = new Set(["WALK"]);

interface RoutePolylinesProps {
  itinerary: Itinerary | null;
  isDark?: boolean;
  hoveredLegIndex?: number | null;
  /** Set to false to prevent auto-fitting map bounds on itinerary change (e.g. comparison hover) */
  autoFitBounds?: boolean;
}

export default function RoutePolylines({ itinerary, isDark = false, hoveredLegIndex = null, autoFitBounds = true }: RoutePolylinesProps) {
  const map = useMap();

  // Auto-fit bounds when itinerary changes
  useEffect(() => {
    if (!autoFitBounds) return;
    if (!itinerary || itinerary.legs.length === 0) return;

    const allPoints: L.LatLngExpression[] = [];
    for (const leg of itinerary.legs) {
      if (!leg.legGeometry?.points) continue;
      for (const pt of leg.legGeometry.points) {
        allPoints.push([pt.lat, pt.lon]);
      }
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [itinerary, map, autoFitBounds]);

  if (!itinerary) return null;

  return (
    <>
      {itinerary.legs.map((leg, i) => {
        if (!leg.legGeometry?.points) return null;
        const positions: L.LatLngExpression[] = leg.legGeometry.points.map(
          (pt) => [pt.lat, pt.lon] as L.LatLngExpression
        );

        if (positions.length < 2) return null;

        const isWalk = DASHED_MODES.has(leg.mode);

        // FR11.8: Hover highlighting — hovered leg gets emphasis, others dim
        const isHovered = hoveredLegIndex === i;
        const hasHover = hoveredLegIndex !== null;

        return isWalk ? (
          // Google Maps-style dotted walking line, theme-aware
          <Polyline
            key={i}
            positions={positions}
            pathOptions={{
              color: isDark ? "#ffffff" : "#1a1a1a",
              weight: isHovered ? 7 : 5,
              opacity: hasHover ? (isHovered ? 1 : 0.3) : 0.9,
              dashArray: "2 10",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ) : (
          <Polyline
            key={i}
            positions={positions}
            pathOptions={{
              color: getLegColor(leg),
              weight: isHovered ? 7 : 4,
              opacity: hasHover ? (isHovered ? 1 : 0.3) : 0.85,
              dashArray: undefined,
            }}
          />
        );
      })}
    </>
  );
}
