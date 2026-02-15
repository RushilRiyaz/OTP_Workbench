"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LocationValue } from "@/components/LocationInput";
import { LEIPZIG_HBF, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "./constants";
import MapEvents from "./MapEvents";
import MapMarkers from "./MapMarkers";
import CursorTracker from "./CursorTracker";
import CoordPopup from "./CoordPopup";

// Fix Leaflet default icon paths for Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface MapViewProps {
  start: LocationValue | null;
  destination: LocationValue | null;
  onStartChange: (loc: LocationValue) => void;
  onDestinationChange: (loc: LocationValue) => void;
}

// FR8: Main map component
export default function MapView({
  start,
  destination,
  onStartChange,
  onDestinationChange,
}: MapViewProps) {
  const [popupCoords, setPopupCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handlePopupOpen = useCallback((coords: { lat: number; lng: number } | null) => {
    setPopupCoords(coords);
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupCoords(null);
  }, []);

  return (
    <div className="relative h-full w-full">
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

        <MapMarkers start={start} destination={destination} />

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
