"use client";

import { useEffect } from "react";
import { Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { Itinerary, Leg } from "@/lib/routing";

const MODE_COLORS: Record<string, string> = {
  WALK: "#9ca3af",
  BUS: "#7c3aed",
  TRAM: "#dc2626",
  SUBURB: "#16a34a",
  TRAIN: "#1e3a5f",
  BIKE: "#ea580c",
  BIKERENTAL: "#ea580c",
};

const DASHED_MODES = new Set(["WALK"]);

function getLegColor(leg: Leg): string {
  if (leg.transitLeg && leg.routeColor) {
    // Use the route's own color if available (e.g. "#E3000F")
    const c = leg.routeColor.startsWith("#") ? leg.routeColor : `#${leg.routeColor}`;
    if (c.length >= 4) return c;
  }
  return MODE_COLORS[leg.mode] ?? "#3b82f6";
}

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
