"use client";

import { useMapEvents } from "react-leaflet";
import type { LocationValue } from "@/components/LocationInput";
import { COORD_PRECISION } from "./constants";

interface MapEventsProps {
  start: LocationValue | null;
  destination: LocationValue | null;
  onStartChange: (loc: LocationValue) => void;
  onDestinationChange: (loc: LocationValue) => void;
  onPopupOpen: (coords: { lat: number; lng: number }) => void;
}

// Check if location has valid coordinates (either direct or from autocomplete)
function hasCoords(loc: LocationValue | null): boolean {
  if (!loc) return false;
  if (loc.coordinates) return true;
  if (loc.location?.lat !== undefined && loc.location?.lon !== undefined) return true;
  return false;
}

// Create a LocationValue from map click coordinates
function createCoordsLocation(lat: number, lng: number): LocationValue {
  return {
    text: `${lat.toFixed(COORD_PRECISION)}, ${lng.toFixed(COORD_PRECISION)}`,
    type: "coordinates",
    location: null,
    stopId: null,
    coordinates: { lat, lon: lng },
  };
}

// FR8.2-8.4: Handle map click events
export default function MapEvents({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  onPopupOpen,
}: MapEventsProps) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;

      // FR8.2: If start is empty, fill start
      if (!hasCoords(start)) {
        onStartChange(createCoordsLocation(lat, lng));
        return;
      }

      // FR8.3: If start filled but dest empty, fill dest
      if (!hasCoords(destination)) {
        onDestinationChange(createCoordsLocation(lat, lng));
        return;
      }

      // FR8.4: Both filled, show popup
      onPopupOpen({ lat, lng });
    },
  });

  return null;
}
