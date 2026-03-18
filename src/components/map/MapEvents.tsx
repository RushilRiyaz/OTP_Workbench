"use client";

import { useMapEvents } from "react-leaflet";
import type { LocationValue } from "@/lib/types";
import { COORD_PRECISION } from "./constants";
import { getCoords } from "./utils";
import { reverseGeocode } from "@/lib/api/reverseGeocode";

interface MapEventsProps {
  start: LocationValue | null;
  destination: LocationValue | null;
  onStartChange: (loc: LocationValue) => void;
  onDestinationChange: (loc: LocationValue) => void;
  onPopupOpen: (coords: { lat: number; lng: number }) => void;
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

// Fire-and-forget reverse geocode, updating text on success
function resolveAddress(
  lat: number,
  lng: number,
  onChange: (loc: LocationValue) => void,
  base: LocationValue
) {
  reverseGeocode(lat, lng).then((address) => {
    if (address) {
      onChange({ ...base, text: address });
    }
  });
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
      if (!getCoords(start)) {
        const loc = createCoordsLocation(lat, lng);
        onStartChange(loc);
        resolveAddress(lat, lng, onStartChange, loc);
        return;
      }

      // FR8.3: If start filled but dest empty, fill dest
      if (!getCoords(destination)) {
        const loc = createCoordsLocation(lat, lng);
        onDestinationChange(loc);
        resolveAddress(lat, lng, onDestinationChange, loc);
        return;
      }

      // FR8.4: Both filled, show popup
      onPopupOpen({ lat, lng });
    },
  });

  return null;
}
