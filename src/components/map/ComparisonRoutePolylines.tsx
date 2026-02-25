"use client";

import { useEffect } from "react";
import { Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { ComparisonMapItinerary, DetailHoveredLeg } from "@/components/comparison/types";
import { computePolylineStyle } from "@/lib/comparisonPolylineUtils";

// FR17.4: Render polylines for multiple itineraries simultaneously
export default function ComparisonRoutePolylines({
  itineraries,
  hoveredLeg = null,
  autoFitBounds = true,
}: {
  itineraries: ComparisonMapItinerary[];
  hoveredLeg?: DetailHoveredLeg | null;
  autoFitBounds?: boolean;
}) {
  const map = useMap();

  // Auto-fit bounds to encompass ALL itineraries
  useEffect(() => {
    if (!autoFitBounds || itineraries.length === 0) return;

    const allPoints: L.LatLngExpression[] = [];
    for (const { itinerary } of itineraries) {
      for (const leg of itinerary.legs) {
        if (!leg.legGeometry?.points) continue;
        for (const pt of leg.legGeometry.points) {
          allPoints.push([pt.lat, pt.lon]);
        }
      }
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [itineraries, map, autoFitBounds]);

  if (itineraries.length === 0) return null;

  return (
    <>
      {itineraries.map(({ itinerary, color }, slotIndex) =>
        itinerary.legs.map((leg, legIndex) => {
          if (!leg.legGeometry?.points) return null;
          const positions: L.LatLngExpression[] = leg.legGeometry.points.map(
            (pt) => [pt.lat, pt.lon] as L.LatLngExpression
          );
          if (positions.length < 2) return null;

          const isWalk = leg.mode === "WALK";
          const { opacity, weight } = computePolylineStyle({ isWalk, hoveredLeg, slotIndex, legIndex });

          return isWalk ? (
            <Polyline
              key={`${slotIndex}-${legIndex}`}
              positions={positions}
              pathOptions={{
                color,
                weight,
                opacity,
                dashArray: "2 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ) : (
            <Polyline
              key={`${slotIndex}-${legIndex}`}
              positions={positions}
              pathOptions={{
                color,
                weight,
                opacity,
              }}
            />
          );
        })
      )}
    </>
  );
}
