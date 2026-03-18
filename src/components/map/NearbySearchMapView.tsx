"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip, useMapEvents, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { useIsDark } from "@/lib/useIsDark";
import type { NearbySearchItem } from "@/lib/nearbySearch";
import { categorizeItem, getStationCount, type MarkerCategory } from "@/lib/nearbySearch";
import { defaultNearbySearchFormState } from "@/components/NearbySearchForm";
import { LEIPZIG_HBF, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION } from "./constants";
import CursorTracker from "./CursorTracker";
import JsonHighlighted from "../JsonHighlighted";

// Dark mode filter (same as MapView.tsx)
const DARK_MAP_FILTER =
  "invert(1) sepia(0.2) hue-rotate(200deg) saturate(0.55) brightness(0.8) contrast(1.1)";

// FR24.1: Marker colors per requirements
const MARKER_COLORS: Record<MarkerCategory, string> = {
  bike: "#1e3a5f",           // Dark blue
  bike_station: "#1e3a5f",   // Dark blue
  escooter: "#c026d3",       // Magenta
  escooter_station: "#c026d3", // Magenta
  mobistation: "#0d9488",    // Turquoise
  other: "#b8860b",          // Dark yellow
};

// FR24.1/FR24.2: Build a circle marker icon with optional count
function createMarkerIcon(
  category: MarkerCategory,
  count: number | null,
  isDark: boolean
): L.DivIcon {
  const color = MARKER_COLORS[category];
  const isStation = category === "bike_station" || category === "escooter_station";
  const size = isStation && count !== null ? 28 : 20;
  const displayCount = isStation && count !== null && count > 0 ? String(count) : "";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid ${isDark ? "#fff" : "#222"};
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-size:${size > 24 ? 11 : 9}px;
      font-weight:700;
      line-height:1;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">${displayCount}</div>`,
  });
}

// FR23.2: Hold-to-radius constants (nice-to-have)
const HOLD_THRESHOLD_MS = 400; // ms before hold-mode activates (long enough to not conflict with pan)
const RADIUS_GROW_INTERVAL_MS = 50; // how often radius grows
const RADIUS_INITIAL = 100; // starting radius when hold begins (meters)
const RADIUS_GROW_RATE = 30; // meters added per interval tick
const RADIUS_MAX = 10000; // cap at 10 km
const MOVE_THRESHOLD_PX = 5; // pixels of movement to consider a drag (not a hold)

// --- Sub-components ---

/**
 * FR23.1/FR23.2: Handles map interactions for center + radius:
 *  - Quick click on empty map area: sets center only (FR23.1)
 *  - Press & hold on empty map area: radius grows while held (FR23.2)
 *  - Drag: normal map panning
 *  - Clicks on markers/clusters: ignored
 */
function MapClickHandler({
  onCenterChange,
  onRadiusChange,
  holdingRef,
}: {
  onCenterChange: (center: { lat: number; lon: number }) => void;
  onRadiusChange: (radius: number) => void;
  holdingRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const growInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHolding = useRef(false);
  const isDragging = useRef(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const radiusRef = useRef(0);
  const holdCenter = useRef<{ lat: number; lon: number } | null>(null);

  // Check if a click target is a marker, cluster, spiderfy leg, or popup (not the raw map tiles)
  const isMarkerOrCluster = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false;
    // SVG elements (spiderfy legs) are not HTMLElement — handle both
    const el = target instanceof HTMLElement
      ? target
      : (target instanceof SVGElement ? target.closest?.("svg")?.parentElement : null);
    if (!el) return false;

    // Use closest() for a single efficient check
    return !!(
      el.closest(".leaflet-marker-icon") ||
      el.closest(".leaflet-marker-shadow") ||
      el.closest(".marker-cluster") ||
      el.closest(".leaflet-popup") ||
      el.closest(".leaflet-overlay-pane svg") // spiderfy legs are SVG paths in the overlay pane
    );
  }, []);

  // Track that a hold just ended so the subsequent click event skips radius reset
  const wasHolding = useRef(false);

  const cleanup = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (growInterval.current) {
      clearInterval(growInterval.current);
      growInterval.current = null;
    }
    if (isHolding.current) {
      map.dragging.enable();
      wasHolding.current = true;
    }
    isHolding.current = false;
    holdingRef.current = false;
    isDragging.current = false;
    mouseDownPos.current = null;
  }, [map, holdingRef]);

  useEffect(() => cleanup, [cleanup]);

  useMapEvents({
    mousedown(e) {
      if ((e.originalEvent as MouseEvent).button !== 0) return;
      // Don't intercept clicks on markers/clusters
      if (isMarkerOrCluster(e.originalEvent.target as EventTarget)) return;

      const orig = e.originalEvent as MouseEvent;
      mouseDownPos.current = { x: orig.clientX, y: orig.clientY };
      isDragging.current = false;

      const center = { lat: e.latlng.lat, lon: e.latlng.lng };

      holdTimer.current = setTimeout(() => {
        if (isDragging.current) return;

        isHolding.current = true;
        holdingRef.current = true;
        holdCenter.current = center;
        map.dragging.disable();

        onCenterChange(center);
        radiusRef.current = RADIUS_INITIAL;
        onRadiusChange(RADIUS_INITIAL);

        growInterval.current = setInterval(() => {
          radiusRef.current = Math.min(
            radiusRef.current + RADIUS_GROW_RATE,
            RADIUS_MAX
          );
          onRadiusChange(radiusRef.current);
        }, RADIUS_GROW_INTERVAL_MS);
      }, HOLD_THRESHOLD_MS);
    },

    mousemove(e) {
      if (mouseDownPos.current && !isHolding.current) {
        const orig = e.originalEvent as MouseEvent;
        const dx = orig.clientX - mouseDownPos.current.x;
        const dy = orig.clientY - mouseDownPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD_PX) {
          isDragging.current = true;
          if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
          }
        }
      }
    },

    mouseup() {
      if (isHolding.current && holdCenter.current) {
        // Fit map to the final radius after hold ends
        const c = L.latLng(holdCenter.current.lat, holdCenter.current.lon);
        const bounds = c.toBounds(radiusRef.current * 2);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17, animate: true });
        holdCenter.current = null;
      }
      cleanup();
    },

    // Leaflet 'click' fires only for stationary clicks (no drag)
    click(e) {
      // Don't set center if click was on a marker/cluster
      if (isMarkerOrCluster(e.originalEvent.target as EventTarget)) return;
      // Skip if this click follows a hold-to-radius (mouseup fires click too)
      if (wasHolding.current) {
        wasHolding.current = false;
        return;
      }
      if (!isHolding.current) {
        onCenterChange({ lat: e.latlng.lat, lon: e.latlng.lng });
        // Reset radius to default on quick click (hold-to-radius sets its own)
        onRadiusChange(defaultNearbySearchFormState.radius);
      }
    },
  });

  return null;
}

/** Auto-fits map bounds on center change — skips during hold-to-radius (MapClickHandler handles that fit on release) */
function BoundsFitter({
  center,
  radius,
  holdingRef,
}: {
  center: { lat: number; lon: number } | null;
  radius: number;
  holdingRef: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const prevCenterKey = useRef<string | null>(null);
  // Store latest radius so the effect can read it without depending on it
  const radiusRef = useRef(radius);
  radiusRef.current = radius;

  useEffect(() => {
    if (!center) return;
    // Skip fitting during hold-to-radius — MapClickHandler fits on mouseup
    if (holdingRef.current) return;

    const key = `${center.lat},${center.lon}`;
    if (prevCenterKey.current === key) return;
    prevCenterKey.current = key;

    const circleCenter = L.latLng(center.lat, center.lon);
    const circleBounds = circleCenter.toBounds(radiusRef.current * 2);
    map.fitBounds(circleBounds, { padding: [30, 30], maxZoom: 17 });
  }, [center, map, holdingRef]); // intentionally no radius dependency

  return null;
}

// --- Main component ---

interface NearbySearchMapViewProps {
  center: { lat: number; lon: number } | null;
  radius: number;
  results: NearbySearchItem[] | null;
  onCenterChange: (center: { lat: number; lon: number }) => void;
  onRadiusChange: (radius: number) => void;
}

export default function NearbySearchMapView({
  center,
  radius,
  results,
  onCenterChange,
  onRadiusChange,
}: NearbySearchMapViewProps) {
  const isDark = useIsDark();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);
  const holdingRef = useRef(false);

  const handleCopyItem = useCallback(async (item: NearbySearchItem) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }, []);

  // Center marker icon
  const centerIcon = L.divIcon({
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:#FBC10F;border:3px solid ${isDark ? "#fff" : "#222"};
      box-shadow:0 0 0 3px rgba(251,193,15,0.3),0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
  });

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
        <MapClickHandler onCenterChange={onCenterChange} onRadiusChange={onRadiusChange} holdingRef={holdingRef} />
        <BoundsFitter center={center} radius={radius} holdingRef={holdingRef} />
        <CursorTracker />

        {/* FR23.3: Center marker */}
        {center && (
          <Marker
            position={[center.lat, center.lon]}
            icon={centerIcon}
            zIndexOffset={1000}
          >
            <Tooltip direction="top" offset={[0, -12]} permanent={false}>
              <span className="text-xs">
                Center: {center.lat.toFixed(5)}, {center.lon.toFixed(5)}
              </span>
            </Tooltip>
          </Marker>
        )}

        {/* FR23.4: Radius circle */}
        {center && (
          <Circle
            center={[center.lat, center.lon]}
            radius={radius}
            pathOptions={{
              color: "#FBC10F",
              fillColor: "#FBC10F",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 4",
            }}
          />
        )}

        {/* FR24.1/FR24.5: Result markers with clustering */}
        {results && results.length > 0 && (
          <MarkerClusterGroup
            ref={clusterRef}
            chunkedLoading
            spiderfyOnMaxZoom  // FR24.6: expand clusters at max zoom
            zoomToBoundsOnClick
            showCoverageOnHover={false}
            maxClusterRadius={40}
            spiderfyDistanceMultiplier={2}
          >
            {results.map((item) => {
              const category = categorizeItem(item);
              const count = getStationCount(item);
              const icon = createMarkerIcon(category, count, isDark);

              return (
                <Marker
                  key={item.id}
                  position={[item.lat, item.lon]}
                  icon={icon}
                >
                  {/* FR24.3: Hover tooltip — type + ID */}
                  <Tooltip direction="top" offset={[0, -12]}>
                    <div className="text-xs">
                      <span className="font-semibold">{item.type}</span>
                      <br />
                      <span className="font-mono text-[10px]">{item.id}</span>
                    </div>
                  </Tooltip>

                  {/* FR24.4: Click popup — full info + copy */}
                  <Popup maxWidth={350} minWidth={250}>
                    <div className="max-h-64 overflow-auto">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-zinc-900 leading-tight">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItem(item);
                          }}
                          className="ml-2 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-700 border border-zinc-300 rounded transition-colors flex-shrink-0"
                        >
                          {copiedId === item.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-500 mb-1">
                        {item.type} &middot; {item.source} &middot;{" "}
                        {item.provider}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mb-2">
                        {item.id}
                      </p>
                      <pre className="text-[10px] font-mono text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                        <JsonHighlighted json={JSON.stringify(item.data, null, 2)} />
                      </pre>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        )}
      </MapContainer>
    </div>
  );
}
