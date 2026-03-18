"use client";

// Specialized map for the Stop Monitor tab.
// Tracks map bounds → debounced fetch of nearby stops → clickable H markers.

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useIsDark } from "@/lib/hooks/useIsDark";
import { fetchStops } from "@/lib/api/stopMonitor";
import type { StopsItem } from "@/lib/api/stopMonitor";
import StopMarkers from "./StopMarkers";
import CursorTracker from "./CursorTracker";
import { LEIPZIG_HBF, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "./constants";

// Reuse same dark filter as MapView
const DARK_MAP_FILTER =
  "invert(1) sepia(0.2) hue-rotate(200deg) saturate(0.55) brightness(0.8) contrast(1.1)";

const FETCH_DEBOUNCE_MS = 500;

// Fix Leaflet default icon paths (needed once per bundle)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// Inner component — must be inside MapContainer to access map context
function BoundsTracker({ onBoundsChange }: { onBoundsChange: (b: L.LatLngBounds) => void }) {
  const map = useMap();

  // Fire once on mount with initial bounds
  useEffect(() => {
    onBoundsChange(map.getBounds());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useMapEvents({
    moveend(e) { onBoundsChange(e.target.getBounds()); },
    zoomend(e) { onBoundsChange(e.target.getBounds()); },
  });

  return null;
}

export interface StopMonitorMapViewProps {
  /** Raw stop_id (with or without _parent) of the selected stop, for highlighting */
  selectedStopId?: string | null;
  onStopSelect: (stop: StopsItem) => void;
  stopMonitorUrl: string;
  apiKey: string;
}

export default function StopMonitorMapView({
  selectedStopId,
  onStopSelect,
  stopMonitorUrl,
  apiKey,
}: StopMonitorMapViewProps) {
  const isDark = useIsDark();
  const [stops, setStops] = useState<StopsItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const latestBoundsRef = useRef<L.LatLngBounds | null>(null);

  const doFetch = useCallback(
    async (bounds: L.LatLngBounds) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const result = await fetchStops(
        { lon1: sw.lng, lat1: sw.lat, lon2: ne.lng, lat2: ne.lat },
        { baseUrl: stopMonitorUrl, apiKey },
        abortRef.current.signal
      );
      setStops(result);
    },
    [stopMonitorUrl, apiKey]
  );

  const handleBoundsChange = useCallback(
    (bounds: L.LatLngBounds) => {
      latestBoundsRef.current = bounds;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doFetch(bounds), FETCH_DEBOUNCE_MS);
    },
    [doFetch]
  );

  // Re-fetch when the environment URL/key changes
  useEffect(() => {
    if (latestBoundsRef.current) {
      doFetch(latestBoundsRef.current);
    }
  }, [stopMonitorUrl, apiKey, doFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      {isDark && (
        <style>{`.leaflet-tile-pane { filter: ${DARK_MAP_FILTER}; transition: filter 300ms; }`}</style>
      )}
      <MapContainer
        center={[LEIPZIG_HBF.lat, LEIPZIG_HBF.lng]}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <BoundsTracker onBoundsChange={handleBoundsChange} />
        <StopMarkers
          stops={stops}
          selectedStopId={selectedStopId}
          onStopClick={onStopSelect}
        />
        <CursorTracker />
      </MapContainer>
    </div>
  );
}
