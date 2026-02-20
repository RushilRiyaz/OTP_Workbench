"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Tabs, { TabId } from "./Tabs";
import { LocationValue } from "./LocationInput";
import Map from "./map/DynamicMapLoader";
import ErrorBoundary from "./ErrorBoundary";
import RoutingResults from "./RoutingResults";
import type { RoutingResponse, Itinerary } from "@/lib/routing";

type SplitLayout = "vertical" | "horizontal";

interface EvaluationAreaProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  startLocation: LocationValue;
  destinationLocation: LocationValue;
  onStartChange: (value: LocationValue) => void;
  onDestinationChange: (value: LocationValue) => void;
  routingResult?: RoutingResponse | null;
  selectedItineraryIndex?: number;
  onSelectItinerary?: (index: number) => void;
  children?: React.ReactNode;
}

const MIN_PANEL_PCT = 20;
const DEFAULT_MAP_PCT = 60;

function invalidateMapSize() {
  // Leaflet maps need a size recalculation after container resize
  setTimeout(() => {
    document.querySelectorAll(".leaflet-container").forEach((el) => {
      const map = (el as HTMLElement & { _leaflet_map?: { invalidateSize: () => void } })._leaflet_map;
      if (map) map.invalidateSize();
    });
    // Fallback: dispatch resize event for Leaflet instances that store map differently
    window.dispatchEvent(new Event("resize"));
  }, 50);
}

export default function EvaluationArea({
  activeTab,
  onTabChange,
  startLocation,
  destinationLocation,
  onStartChange,
  onDestinationChange,
  routingResult,
  selectedItineraryIndex = 0,
  onSelectItinerary,
  children,
}: EvaluationAreaProps) {
  const itineraries = routingResult?.plan?.itineraries ?? [];
  const selectedItinerary: Itinerary | null =
    itineraries[selectedItineraryIndex] ?? null;
  const hasResults = itineraries.length > 0;

  const [layout, setLayout] = useState<SplitLayout>("vertical");
  const [mapPct, setMapPct] = useState(DEFAULT_MAP_PCT);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const toggleLayout = useCallback(() => {
    setLayout((prev) => (prev === "vertical" ? "horizontal" : "vertical"));
    setMapPct(DEFAULT_MAP_PCT);
  }, []);

  // Invalidate map size when layout or split changes
  useEffect(() => {
    invalidateMapSize();
  }, [layout, hasResults]);

  // --- Drag resize ---
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = layout === "vertical" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  }, [layout]);

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct: number;
      if (layout === "vertical") {
        pct = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        pct = ((e.clientX - rect.left) / rect.width) * 100;
      }
      pct = Math.max(MIN_PANEL_PCT, Math.min(100 - MIN_PANEL_PCT, pct));
      setMapPct(pct);
    };

    const handleDragEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      invalidateMapSize();
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [layout]);

  const isVertical = layout === "vertical";

  return (
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
      <Tabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "routing" && (
          <div className="flex flex-col h-full">
            {/* Layout toggle button — only show when results present */}
            {hasResults && (
              <div className="flex items-center justify-end px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={toggleLayout}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                  title={isVertical ? "Switch to side-by-side layout" : "Switch to stacked layout"}
                >
                  {isVertical ? (
                    // Columns icon
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 4.5v15m6-15v15M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  ) : (
                    // Rows icon
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 9h15m-15 6h15M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  )}
                  <span>{isVertical ? "Side by side" : "Stacked"}</span>
                </button>
              </div>
            )}

            {/* Split container */}
            <div
              ref={containerRef}
              className={`flex-1 flex min-h-0 ${isVertical ? "flex-col" : "flex-row"}`}
            >
              {/* Map panel */}
              <div
                className="min-h-0 min-w-0"
                style={
                  hasResults
                    ? isVertical
                      ? { height: `${mapPct}%` }
                      : { width: `${mapPct}%` }
                    : { flex: 1 }
                }
              >
                <ErrorBoundary
                  fallback={
                    <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Map failed to load. Try refreshing.
                      </p>
                    </div>
                  }
                >
                  <Map
                    start={startLocation}
                    destination={destinationLocation}
                    onStartChange={onStartChange}
                    onDestinationChange={onDestinationChange}
                    selectedItinerary={selectedItinerary}
                  />
                </ErrorBoundary>
              </div>

              {/* Drag divider */}
              {hasResults && (
                <div
                  onMouseDown={handleDragStart}
                  className={`flex-shrink-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors ${
                    isVertical
                      ? "h-2 cursor-row-resize border-y border-zinc-300 dark:border-zinc-700"
                      : "w-2 cursor-col-resize border-x border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {/* Grip dots */}
                  <div className={`flex gap-0.5 ${isVertical ? "flex-row" : "flex-col"}`}>
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  </div>
                </div>
              )}

              {/* Results panel */}
              {hasResults && (
                <div
                  className="min-h-0 min-w-0 bg-zinc-50 dark:bg-zinc-950"
                  style={
                    isVertical
                      ? { height: `${100 - mapPct}%` }
                      : { width: `${100 - mapPct}%` }
                  }
                >
                  <RoutingResults
                    routingResult={routingResult ?? null}
                    selectedIndex={selectedItineraryIndex}
                    onSelectItinerary={onSelectItinerary ?? (() => {})}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab !== "routing" && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Coming soon</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">The {activeTab} feature is under development.</p>
            </div>
            {children}
          </div>
        )}
      </div>
    </main>
  );
}
