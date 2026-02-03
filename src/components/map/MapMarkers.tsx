"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";
import type { LocationValue } from "@/components/LocationInput";
import { getCoords } from "./utils";

interface MapMarkersProps {
  start: LocationValue | null;
  destination: LocationValue | null;
}

// Create colored marker icons using SVG
const createMarkerIcon = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#333" stroke-width="1"/>
        <circle cx="12.5" cy="12.5" r="5" fill="white"/>
      </svg>
    `,
  });

const startIcon = createMarkerIcon("#3b82f6"); // blue-500
const destIcon = createMarkerIcon("#ef4444");  // red-500

// FR8.1: Display start/destination markers on map
export default function MapMarkers({ start, destination }: MapMarkersProps) {
  const startCoords = getCoords(start);
  const destCoords = getCoords(destination);

  return (
    <>
      {startCoords && (
        <Marker position={[startCoords.lat, startCoords.lng]} icon={startIcon} />
      )}
      {destCoords && (
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon} />
      )}
    </>
  );
}
