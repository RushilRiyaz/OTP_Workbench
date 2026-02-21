"use client";

import { useEffect } from "react";
import { Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { Itinerary } from "@/lib/routing";
import { getLegColor } from "@/lib/legUtils";

const DASHED_MODES = new Set(["WALK"]);

interface RoutePolylinesProps {
  itinerary: Itinerary | null;
  isDark?: boolean;
}

export default function RoutePolylines({ itinerary, isDark = false }: RoutePolylinesProps) {
  const map = useMap();

  // Auto-fit bounds when itinerary changes
  useEffect(() => {
    if (!itinerary || itinerary.legs.length === 0) return;

    const allPoints: L.LatLngExpression[] = [];
    for (const leg of itinerary.legs) {
      for (const pt of leg.legGeometry.points) {
        allPoints.push([pt.lat, pt.lon]);
      }
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [itinerary, map]);

  if (!itinerary) return null;

  return (
    <>
      {itinerary.legs.map((leg, i) => {
        const positions: L.LatLngExpression[] = leg.legGeometry.points.map(
          (pt) => [pt.lat, pt.lon] as L.LatLngExpression
        );

        if (positions.length < 2) return null;

        const isWalk = DASHED_MODES.has(leg.mode);

        return isWalk ? (
          // Google Maps-style dotted walking line, theme-aware
          <Polyline
            key={i}
            positions={positions}
            pathOptions={{
              color: isDark ? "#ffffff" : "#1a1a1a",
              weight: 5,
              opacity: 0.9,
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
              weight: 4,
              opacity: 0.85,
            }}
          />
        );
      })}
    </>
  );
}
