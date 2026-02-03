"use client";

import { Marker } from "react-leaflet";
import type { LocationValue } from "@/components/LocationInput";

interface MapMarkersProps {
  start: LocationValue | null;
  destination: LocationValue | null;
}

// Extract lat/lng from LocationValue
// Handles both autocomplete results (location.lat/lon) and direct coordinates
function getCoords(
  loc: LocationValue | null
): { lat: number; lng: number } | null {
  if (!loc) return null;

  // Direct coordinates input
  if (loc.coordinates) {
    return { lat: loc.coordinates.lat, lng: loc.coordinates.lon };
  }

  // Autocomplete result with lat/lon
  if (loc.location?.lat !== undefined && loc.location?.lon !== undefined) {
    return { lat: loc.location.lat, lng: loc.location.lon };
  }

  return null;
}

// FR8.1: Display start/destination markers on map
export default function MapMarkers({ start, destination }: MapMarkersProps) {
  const startCoords = getCoords(start);
  const destCoords = getCoords(destination);

  return (
    <>
      {startCoords && (
        <Marker position={[startCoords.lat, startCoords.lng]} />
      )}
      {destCoords && (
        <Marker position={[destCoords.lat, destCoords.lng]} />
      )}
    </>
  );
}
