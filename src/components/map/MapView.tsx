"use client";

import { useState, useCallback } from "react";
import { useIsDark } from "@/lib/useIsDark";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LocationValue } from "@/components/LocationInput";
import type { Itinerary } from "@/lib/routing";
import { LEIPZIG_HBF, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "./constants";
import MapEvents from "./MapEvents";
import MapMarkers from "./MapMarkers";
import CursorTracker from "./CursorTracker";
import CoordPopup from "./CoordPopup";
import RoutePolylines from "./RoutePolylines";

// Fix Leaflet default icon paths for Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// CSS filter chain to approximate the Leipzig MOVE dark map palette:
//   Background ≈ #1A2746 (dark navy)   Roads ≈ #404D5D (blue-grey)
//   Parks      ≈ #56988D (teal-green)   Water ≈ #558C9B (teal-blue)
//
// 1. invert(1)           – flip light tiles to a dark base
// 2. sepia(0.2)          – add warm tone as raw material for hue rotation
// 3. hue-rotate(200deg)  – 20° past neutral pushes everything toward
//                          blue/teal, giving the navy BG and teal-green parks
// 4. saturate(0.55)      – enough colour for teal parks & blue water
//                          without oversaturation
// 5. brightness(0.8)     – lift from pure-dark to the reference's charcoal-navy
// 6. contrast(1.1)       – sharpen roads/labels for readability
const DARK_MAP_FILTER =
  "invert(1) sepia(0.2) hue-rotate(200deg) saturate(0.55) brightness(0.8) contrast(1.1)";

interface MapViewProps {
  start: LocationValue | null;
  destination: LocationValue | null;
  onStartChange: (loc: LocationValue) => void;
  onDestinationChange: (loc: LocationValue) => void;
  selectedItinerary?: Itinerary | null;
  hoveredLegIndex?: number | null;
}

export default function MapView({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  selectedItinerary,
  hoveredLegIndex,
}: MapViewProps) {
  const [popupCoords, setPopupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const isDark = useIsDark();

  const handlePopupOpen = useCallback((coords: { lat: number; lng: number } | null) => {
    setPopupCoords(coords);
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupCoords(null);
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Apply dark filter only to map tiles, not polylines/markers */}
      {isDark && (
        <style>{`.leaflet-tile-pane { filter: ${DARK_MAP_FILTER}; transition: filter 300ms; }`}</style>
      )}
      <MapContainer
        center={[LEIPZIG_HBF.lat, LEIPZIG_HBF.lng]}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        <MapEvents
          start={start}
          destination={destination}
          onStartChange={onStartChange}
          onDestinationChange={onDestinationChange}
          onPopupOpen={handlePopupOpen}
        />

        <MapMarkers start={start} destination={destination} isDark={isDark} />

        <RoutePolylines itinerary={selectedItinerary ?? null} isDark={isDark} hoveredLegIndex={hoveredLegIndex ?? null} />

        <CursorTracker />

        {popupCoords && (
          <CoordPopup
            coords={popupCoords}
            onClose={handleClosePopup}
          />
        )}
      </MapContainer>
    </div>
  );
}
