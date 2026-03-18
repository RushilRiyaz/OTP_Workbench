"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useIsDark } from "@/lib/useIsDark";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LocationValue, ComparisonMapItinerary, DetailHoveredLeg } from "@/lib/types";
import type { Itinerary } from "@/lib/routing";
import { LEIPZIG_HBF, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "./constants";
import MapEvents from "./MapEvents";
import MapMarkers from "./MapMarkers";
import CursorTracker from "./CursorTracker";
import CoordPopup from "./CoordPopup";
import RoutePolylines from "./RoutePolylines";
import ComparisonRoutePolylines from "./ComparisonRoutePolylines";
import StopMarkers from "./StopMarkers";
import { fetchStops } from "@/lib/stopMonitor";
import type { StopsItem } from "@/lib/stopMonitor";

const FETCH_DEBOUNCE_MS = 500;

// Inner component — must be inside MapContainer to access map context
function StopMarkersLayer({
  stopMonitorUrl,
  apiKey,
  start,
  destination,
  onStartChange,
  onDestinationChange,
}: {
  stopMonitorUrl: string;
  apiKey: string;
  start: LocationValue | null;
  destination: LocationValue | null;
  onStartChange: (loc: LocationValue) => void;
  onDestinationChange: (loc: LocationValue) => void;
}) {
  const [stops, setStops] = useState<StopsItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const map = useMap();

  const doFetch = useCallback(async (bounds: L.LatLngBounds) => {
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
  }, [stopMonitorUrl, apiKey]);

  useEffect(() => {
    doFetch(map.getBounds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useMapEvents({
    moveend(e) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doFetch(e.target.getBounds()), FETCH_DEBOUNCE_MS);
    },
    zoomend(e) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doFetch(e.target.getBounds()), FETCH_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const handleStopClick = useCallback((stop: StopsItem) => {
    const loc: LocationValue = {
      type: "coordinates",
      text: stop.stop_name,
      coordinates: { lat: stop.lat, lon: stop.lon },
      location: null,
      stopId: null,
    };
    setLastClickedId(stop.stop_id);
    if (!start?.text) {
      onStartChange(loc);
    } else {
      onDestinationChange(loc);
    }
  }, [start, onStartChange, onDestinationChange]);

  return <StopMarkers stops={stops} selectedStopId={lastClickedId} onStopClick={handleStopClick} />;
}

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
  /** Set to false to prevent auto-fitting map bounds on itinerary change */
  autoFitBounds?: boolean;
  /** FR17: Multiple itineraries for detail comparison map */
  comparisonItineraries?: ComparisonMapItinerary[];
  comparisonHoveredLeg?: DetailHoveredLeg | null;
  /** Show H stop markers fetched from the Stop Monitor API */
  stopMonitorUrl?: string;
  apiKey?: string;
}

export default function MapView({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  selectedItinerary,
  hoveredLegIndex,
  autoFitBounds = true,
  comparisonItineraries,
  comparisonHoveredLeg,
  stopMonitorUrl,
  apiKey,
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

        {comparisonItineraries && comparisonItineraries.length > 0 ? (
          <ComparisonRoutePolylines
            itineraries={comparisonItineraries}
            hoveredLeg={comparisonHoveredLeg ?? null}
            autoFitBounds={autoFitBounds}
          />
        ) : (
          <RoutePolylines itinerary={selectedItinerary ?? null} isDark={isDark} hoveredLegIndex={hoveredLegIndex ?? null} autoFitBounds={autoFitBounds} />
        )}

        {stopMonitorUrl && apiKey && !selectedItinerary && (!comparisonItineraries || comparisonItineraries.length === 0) && (
          <StopMarkersLayer
            stopMonitorUrl={stopMonitorUrl}
            apiKey={apiKey}
            start={start}
            destination={destination}
            onStartChange={onStartChange}
            onDestinationChange={onDestinationChange}
          />
        )}

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
