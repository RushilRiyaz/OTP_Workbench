"use client";

import { Marker } from "react-leaflet";
import type { LocationValue } from "@/components/LocationInput";
import { getCoords } from "./utils";

interface MapMarkersProps {
  start: LocationValue | null;
  destination: LocationValue | null;
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
