"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { LocationValue } from "@/lib/types";
import { getCoords } from "./utils";
import CoordPopup from "./CoordPopup";

interface MapMarkersProps {
  start: LocationValue | null;
  destination: LocationValue | null;
  isDark?: boolean;
}

// Create colored marker icons using SVG with gradient fill
const createMarkerIcon = (color: string, highlightColor: string, accentBg: string) =>
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
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="url(#grad-${color.replace("#", "")})" stroke="${accentBg}" stroke-width="1.5" filter="url(#shadow-${color.replace("#", "")})"/>
        <circle cx="12.5" cy="12.5" r="4.5" fill="${accentBg}" opacity="0.9"/>
      </svg>
    `,
  });

// FR8.1: Display start/destination markers on map
export default function MapMarkers({ start, destination, isDark = false }: MapMarkersProps) {
  const t = useTranslations("Map");
  const startCoords = getCoords(start);
  const destCoords = getCoords(destination);

  const accentBg = isDark ? "#1a1a1a" : "#ffffff";

  const startIcon = useMemo(
    () => createMarkerIcon("#1d4ed8", "#60a5fa", accentBg),
    [accentBg]
  );
  const destIcon = useMemo(
    () => createMarkerIcon("#b91c1c", "#f87171", accentBg),
    [accentBg]
  );

  return (
    <>
      {startCoords && (
        <Marker position={[startCoords.lat, startCoords.lng]} icon={startIcon}>
          <Tooltip direction="bottom" offset={[0, 4]} permanent className="marker-label">
            {t("start")}
          </Tooltip>
          <CoordPopup
            coords={startCoords}
            label={t("start")}
            onClose={() => {}}
          />
        </Marker>
      )}
      {destCoords && (
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
          <Tooltip direction="bottom" offset={[0, 4]} permanent className="marker-label">
            {t("destination")}
          </Tooltip>
          <CoordPopup
            coords={destCoords}
            label={t("destination")}
            onClose={() => {}}
          />
        </Marker>
      )}
    </>
  );
}
