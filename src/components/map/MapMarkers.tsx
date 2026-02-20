"use client";

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { LocationValue } from "@/components/LocationInput";
import { getCoords } from "./utils";
import CoordPopup from "./CoordPopup";

interface MapMarkersProps {
  start: LocationValue | null;
  destination: LocationValue | null;
}

// Create colored marker icons using SVG with gradient fill
const createMarkerIcon = (color: string, highlightColor: string) =>
  L.divIcon({
    className: "",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-${color.replace("#", "")}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${highlightColor}"/>
            <stop offset="100%" stop-color="${color}"/>
          </linearGradient>
          <filter id="shadow-${color.replace("#", "")}">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="url(#grad-${color.replace("#", "")})" stroke="#1a1a1a" stroke-width="1.5" filter="url(#shadow-${color.replace("#", "")})"/>
        <circle cx="12.5" cy="12.5" r="4.5" fill="#1a1a1a" opacity="0.85"/>
      </svg>
    `,
  });

const startIcon = createMarkerIcon("#1d4ed8", "#60a5fa"); // blue-700 → blue-400
const destIcon = createMarkerIcon("#b91c1c", "#f87171");   // red-700 → red-400

// FR8.1: Display start/destination markers on map
export default function MapMarkers({ start, destination }: MapMarkersProps) {
  const startCoords = getCoords(start);
  const destCoords = getCoords(destination);

  return (
    <>
      {startCoords && (
        <Marker position={[startCoords.lat, startCoords.lng]} icon={startIcon}>
          <Tooltip direction="top" offset={[0, -36]}>Start</Tooltip>
          <CoordPopup
            coords={startCoords}
            label="Start"
            onClose={() => {}}
          />
        </Marker>
      )}
      {destCoords && (
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
          <Tooltip direction="top" offset={[0, -36]}>End</Tooltip>
          <CoordPopup
            coords={destCoords}
            label="End"
            onClose={() => {}}
          />
        </Marker>
      )}
    </>
  );
}
