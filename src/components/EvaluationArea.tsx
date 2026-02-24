"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Tabs, { TabId } from "./Tabs";
import { LocationValue } from "./LocationInput";
import Map from "./map/DynamicMapLoader";
import ErrorBoundary from "./ErrorBoundary";
import RoutingResults from "./RoutingResults";
import type { RoutingResponse, RoutingError, Itinerary } from "@/lib/routing";
import type { Environment } from "./EnvironmentSelector";
import ItineraryCard from "./ItineraryCard";
import { useIsDark } from "@/lib/useIsDark";
import {
  computeTimelineRange,
  timeToY,
  computeTotalHeight,
  generateHourMarkers,
  DEFAULT_PIXELS_PER_MINUTE,
  TimelineConfig,
} from "@/lib/timelineUtils";
import {
  MODE_LABELS,
  formatTimestamp,
  formatDuration,
  getLegColor,
  getUniqueProducts,
} from "@/lib/legUtils";

type SplitLayout = "vertical" | "horizontal";
// FR13: Three comparison layout modes
type ComparisonLayout = "horizontal" | "vertical" | "overview";

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
  onLoadMore?: (direction: "earlier" | "later") => Promise<void>;
  onClearResults?: () => void;
  hoveredLegIndex?: number | null;
  onHoverLeg?: (index: number | null) => void;
  children?: React.ReactNode;
  // FR13: Comparison props
  comparisonResults?: Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }>;
  selectedEnvironments?: string[];
  customEnvironments?: Environment[];
  // FR14: Comparison interaction props
  comparisonHoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  comparisonSelectedItinerary?: { envId: string; itineraryIndex: number } | null;
  comparisonMapItinerary?: Itinerary | null;
  comparisonHoveredLegIndex?: number | null;
  onComparisonHover?: (envId: string, itineraryIndex: number | null) => void;
  onComparisonSelect?: (envId: string, itineraryIndex: number) => void;
  onComparisonHoverLeg?: (index: number | null) => void;
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
  onLoadMore,
  onClearResults,
  hoveredLegIndex,
  onHoverLeg,
  children,
  comparisonResults,
  selectedEnvironments,
  customEnvironments,
  comparisonHoveredItinerary,
  comparisonSelectedItinerary,
  comparisonMapItinerary,
  comparisonHoveredLegIndex,
  onComparisonHover,
  onComparisonSelect,
  onComparisonHoverLeg,
}: EvaluationAreaProps) {
  const itineraries = routingResult?.plan?.itineraries ?? [];
  const selectedItinerary: Itinerary | null =
    itineraries[selectedItineraryIndex] ?? null;
  const hasResults = itineraries.length > 0;
  const hasComparisonResults = Object.keys(comparisonResults ?? {}).length > 0;

  const [layout, setLayout] = useState<SplitLayout>("vertical");
  const [comparisonLayout, setComparisonLayout] = useState<ComparisonLayout>("horizontal"); // FR13.1: default
  const [mapPct, setMapPct] = useState(DEFAULT_MAP_PCT);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const toggleLayout = useCallback(() => {
    setLayout((prev) => (prev === "vertical" ? "horizontal" : "vertical"));
    setMapPct(DEFAULT_MAP_PCT);
  }, []);

  // Invalidate map size when layout or split changes
  useEffect(() => {
    invalidateMapSize();
  }, [layout, hasResults, hasComparisonResults]);

  // --- Drag resize (shared between routing and comparison tabs — only one active at a time) ---
  // Comparison tab always uses vertical split (map on top), so drag is always row-resize
  const currentDragLayout = activeTab === "routing-comparison" ? "vertical" : layout;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = currentDragLayout === "vertical" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  }, [currentDragLayout]);

  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct: number;
      if (currentDragLayout === "vertical") {
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
  }, [currentDragLayout]);

  const isVertical = layout === "vertical";

  // FR14: Whether the comparison map should auto-fit bounds (only on selection, not hover)
  const comparisonAutoFitBounds = comparisonHoveredItinerary === null;

  return (
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
      <Tabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "routing" && (
          <div className="flex flex-col h-full">
            {/* Layout toggle button — only show when results present */}
            {hasResults && (
              <div className="flex items-center justify-between px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                {/* Clear results */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                  title="Clear results"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear</span>
                </button>
                {/* Layout toggle */}
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
                    hoveredLegIndex={hoveredLegIndex ?? null}
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
                    onLoadMore={onLoadMore}
                    onHoverLeg={onHoverLeg}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* FR13: Routing Comparison tab — FR14: with map + timeline */}
        {activeTab === "routing-comparison" && (
          <div className="flex flex-col h-full">
            {/* Toolbar: clear + layout toggle — only show when comparison has results */}
            {hasComparisonResults && (
              <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                {/* Clear results */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                  title="Clear results"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear</span>
                </button>
                {/* Layout toggle */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                  {([
                    { id: "horizontal" as const, label: "Horizontal" },
                    { id: "vertical" as const, label: "Vertical" },
                    { id: "overview" as const, label: "Overview" },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setComparisonLayout(opt.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        comparisonLayout === opt.id
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FR14: Split container — map on top, comparison layout below */}
            <div
              ref={activeTab === "routing-comparison" ? containerRef : undefined}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Map panel */}
              <div
                className="min-h-0 min-w-0"
                style={hasComparisonResults ? { height: `${mapPct}%` } : { flex: 1 }}
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
                    selectedItinerary={comparisonMapItinerary ?? null}
                    hoveredLegIndex={comparisonHoveredLegIndex ?? null}
                    autoFitBounds={comparisonAutoFitBounds}
                  />
                </ErrorBoundary>
              </div>

              {/* Drag divider */}
              {hasComparisonResults && (
                <div
                  onMouseDown={handleDragStart}
                  className="flex-shrink-0 flex items-center justify-center h-2 cursor-row-resize border-y border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex gap-0.5 flex-row">
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <div className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  </div>
                </div>
              )}

              {/* Comparison content panel */}
              {hasComparisonResults && (
                <div
                  className="min-h-0 min-w-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col"
                  style={{ height: `${100 - mapPct}%` }}
                >
                  {comparisonLayout === "horizontal" && (
                    <TimelineComparisonLayout
                      comparisonResults={comparisonResults ?? {}}
                      selectedEnvironments={selectedEnvironments ?? []}
                      customEnvironments={customEnvironments ?? []}
                      comparisonHoveredItinerary={comparisonHoveredItinerary}
                      comparisonSelectedItinerary={comparisonSelectedItinerary}
                      onComparisonHover={onComparisonHover}
                      onComparisonSelect={onComparisonSelect}
                      onComparisonHoverLeg={onComparisonHoverLeg}
                    />
                  )}
                  {comparisonLayout === "vertical" && (
                    <ComparisonColumnsLayout
                      direction="column"
                      comparisonResults={comparisonResults ?? {}}
                      selectedEnvironments={selectedEnvironments ?? []}
                      customEnvironments={customEnvironments ?? []}
                    />
                  )}
                  {comparisonLayout === "overview" && (
                    <ComparisonOverviewLayout
                      comparisonResults={comparisonResults ?? {}}
                      selectedEnvironments={selectedEnvironments ?? []}
                      customEnvironments={customEnvironments ?? []}
                    />
                  )}
                </div>
              )}

              {/* Empty state when no results */}
              {!hasComparisonResults && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    Select environments and submit a routing request to compare
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab !== "routing" && activeTab !== "routing-comparison" && (
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

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-5 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Clear routing results?
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              This will remove all itineraries and return to the map view.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearResults?.();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- FR13: Comparison layout helpers ---

const PREDEFINED_LABELS: Record<string, string> = {
  prod: "PROD",
  stage: "STAGE",
  dev: "DEV",
};

// FR16.2: Environment comparison colors
const ENV_COLORS = ["#0072B2", "#E69F00", "#009E73"] as const;

function getEnvLabel(envId: string, customEnvironments: Environment[]): string {
  if (PREDEFINED_LABELS[envId]) return PREDEFINED_LABELS[envId];
  const custom = customEnvironments.find((e) => e.id === envId);
  return custom?.label ?? envId;
}

interface ComparisonLayoutProps {
  comparisonResults: Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }>;
  selectedEnvironments: string[];
  customEnvironments: Environment[];
}

/** Shared empty state for comparison layouts */
function ComparisonEmptyState({ selectedEnvironments }: { selectedEnvironments: string[] }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {selectedEnvironments.length === 0
            ? "Select environments to compare"
            : "Submit a routing request to compare environments"}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {selectedEnvironments.length === 0
            ? "Choose up to 3 environments from the parameter area."
            : `${selectedEnvironments.length} environment${selectedEnvironments.length > 1 ? "s" : ""} selected.`}
        </p>
      </div>
    </div>
  );
}

/** Shared per-environment content renderer (loading / error / itineraries) */
function EnvColumnContent({
  envId,
  result,
  error,
  isLoading,
  label,
}: {
  envId: string;
  result: RoutingResponse | null;
  error: RoutingError | null;
  isLoading: boolean;
  label: string;
}) {
  const itineraries = result?.plan?.itineraries ?? [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-lvb-yellow rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Loading {label}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="text-center">
          <div className="mx-auto w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Request failed</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px]">
            {error.message || "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No itineraries found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {itineraries.map((itinerary, i) => (
        <ItineraryCard
          key={`${envId}-${itinerary.startTime}-${itinerary.endTime}-${i}`}
          itinerary={itinerary}
          index={i}
          isSelected={false}
          onSelect={() => {}}
        />
      ))}
    </div>
  );
}

// --- FR13.1 + FR13.2: Side-by-side columns layout (used for "vertical" comparison mode) ---

function ComparisonColumnsLayout({
  direction,
  comparisonResults,
  selectedEnvironments,
  customEnvironments,
}: ComparisonLayoutProps & { direction: "row" | "column" }) {
  const hasAnyResults = Object.keys(comparisonResults).length > 0;

  if (!hasAnyResults) {
    return <ComparisonEmptyState selectedEnvironments={selectedEnvironments} />;
  }

  const envIds = selectedEnvironments.filter((id) => comparisonResults[id]);
  const isRow = direction === "row";
  const dividerClass = isRow
    ? "divide-x divide-zinc-200 dark:divide-zinc-800"
    : "divide-y divide-zinc-200 dark:divide-zinc-800";

  return (
    <div className={`flex-1 flex min-h-0 ${isRow ? "flex-row" : "flex-col"} ${dividerClass}`}>
      {envIds.map((envId) => {
        const entry = comparisonResults[envId];
        const label = getEnvLabel(envId, customEnvironments);
        const itineraries = entry.result?.plan?.itineraries ?? [];

        return (
          <div key={envId} className={`flex-1 flex flex-col ${isRow ? "min-w-0" : "min-h-0"}`}>
            {/* Section header */}
            <div className="flex-shrink-0 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {label}
                </span>
                {!entry.isLoading && entry.result && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {itineraries.length} itinerar{itineraries.length === 1 ? "y" : "ies"}
                  </span>
                )}
              </div>
            </div>

            <EnvColumnContent
              envId={envId}
              result={entry.result}
              error={entry.error}
              isLoading={entry.isLoading}
              label={label}
            />
          </div>
        );
      })}
    </div>
  );
}

// --- FR13.3 + FR16: Horizontal overview — single merged list with env color coding ---

function ComparisonOverviewLayout({
  comparisonResults,
  selectedEnvironments,
  customEnvironments,
}: ComparisonLayoutProps) {
  const hasAnyResults = Object.keys(comparisonResults).length > 0;

  if (!hasAnyResults) {
    return <ComparisonEmptyState selectedEnvironments={selectedEnvironments} />;
  }

  const envIds = selectedEnvironments.filter((id) => comparisonResults[id]);

  // Check if any env is still loading
  const anyLoading = envIds.some((id) => comparisonResults[id].isLoading);
  if (anyLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-lvb-yellow rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Loading results...</p>
        </div>
      </div>
    );
  }

  // FR16.1: Merge all itineraries into a single list, tagged with env info
  const mergedItineraries: { envId: string; envIndex: number; itinerary: Itinerary; label: string }[] = [];
  envIds.forEach((envId, envIndex) => {
    const entry = comparisonResults[envId];
    if (entry.result?.plan?.itineraries) {
      const label = getEnvLabel(envId, customEnvironments);
      entry.result.plan.itineraries.forEach((itinerary) => {
        mergedItineraries.push({ envId, envIndex, itinerary, label });
      });
    }
  });

  // Sort by departure time
  mergedItineraries.sort((a, b) => a.itinerary.startTime - b.itinerary.startTime);

  if (mergedItineraries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No itineraries found across any environment.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* FR16.3: Legend */}
      <div className="flex-shrink-0 flex items-center gap-4 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        {envIds.map((envId, i) => {
          const label = getEnvLabel(envId, customEnvironments);
          const count = comparisonResults[envId].result?.plan?.itineraries?.length ?? 0;
          return (
            <div key={envId} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: ENV_COLORS[i] ?? "#888" }}
              />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {label}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* FR16.1: Merged itinerary list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {mergedItineraries.map(({ envId, envIndex, itinerary, label }, i) => (
          <div
            key={`${envId}-${itinerary.startTime}-${itinerary.endTime}-${i}`}
            className="relative"
          >
            {/* FR16.2: Color-coded environment indicator */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: ENV_COLORS[envIndex] ?? "#888" }}
            />
            <div className="pl-3">
              <div className="flex items-center gap-1.5 mb-0.5 pt-1 px-2">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ENV_COLORS[envIndex] ?? "#888" }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {label}
                </span>
              </div>
              <ItineraryCard
                itinerary={itinerary}
                index={i}
                isSelected={false}
                onSelect={() => {}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- FR14: Timeline Comparison Layout ---

interface TimelineComparisonLayoutProps extends ComparisonLayoutProps {
  comparisonHoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  comparisonSelectedItinerary?: { envId: string; itineraryIndex: number } | null;
  onComparisonHover?: (envId: string, itineraryIndex: number | null) => void;
  onComparisonSelect?: (envId: string, itineraryIndex: number) => void;
  onComparisonHoverLeg?: (index: number | null) => void;
}

function TimelineComparisonLayout({
  comparisonResults,
  selectedEnvironments,
  customEnvironments,
  comparisonHoveredItinerary,
  comparisonSelectedItinerary,
  onComparisonHover,
  onComparisonSelect,
  onComparisonHoverLeg,
}: TimelineComparisonLayoutProps) {
  const hasAnyResults = Object.keys(comparisonResults).length > 0;
  const isDark = useIsDark();

  if (!hasAnyResults) {
    return <ComparisonEmptyState selectedEnvironments={selectedEnvironments} />;
  }

  const envIds = selectedEnvironments.filter((id) => comparisonResults[id]);

  // Check if any env is still loading
  const anyLoading = envIds.some((id) => comparisonResults[id].isLoading);
  if (anyLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-lvb-yellow rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Loading results...</p>
        </div>
      </div>
    );
  }

  // Compute timeline range and config
  const timelineRange = computeTimelineRange(comparisonResults, envIds);
  const config: TimelineConfig = {
    timelineStart: timelineRange.start,
    timelineEnd: timelineRange.end,
    pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
  };
  const totalHeight = computeTotalHeight(config);
  const hourMarkers = generateHourMarkers(config);

  // Check if all envs have no itineraries
  const totalItineraryCount = envIds.reduce((sum, id) => {
    return sum + (comparisonResults[id]?.result?.plan?.itineraries?.length ?? 0);
  }, 0);

  if (totalItineraryCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No itineraries found across any environment.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Fixed column headers */}
      <div className="flex-shrink-0 flex border-b border-zinc-200 dark:border-zinc-800">
        {/* Time axis header */}
        <div className="w-14 flex-shrink-0 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Time</span>
        </div>
        {/* Env column headers */}
        {envIds.map((envId, i) => {
          const label = getEnvLabel(envId, customEnvironments);
          const count = comparisonResults[envId]?.result?.plan?.itineraries?.length ?? 0;
          return (
            <div
              key={envId}
              className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-r last:border-r-0 border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: ENV_COLORS[i] ?? "#888" }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  {label}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  ({count})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FR14.2: Single scrollable container — all columns scroll together automatically */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: Math.max(totalHeight, 200) }}>
          {/* Time axis column */}
          <TimeAxis hourMarkers={hourMarkers} totalHeight={Math.max(totalHeight, 200)} />

          {/* Environment columns */}
          {envIds.map((envId, envIndex) => (
            <TimelineEnvColumn
              key={envId}
              envId={envId}
              envIndex={envIndex}
              comparisonResults={comparisonResults}
              config={config}
              totalHeight={Math.max(totalHeight, 200)}
              hourMarkers={hourMarkers}
              isDark={isDark}
              hoveredItinerary={comparisonHoveredItinerary}
              selectedItinerary={comparisonSelectedItinerary}
              onHover={onComparisonHover}
              onSelect={onComparisonSelect}
              onHoverLeg={onComparisonHoverLeg}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// FR14.2: Vertical time axis with hour markers
function TimeAxis({
  hourMarkers,
  totalHeight,
}: {
  hourMarkers: { time: number; label: string; y: number }[];
  totalHeight: number;
}) {
  return (
    <div
      className="w-14 flex-shrink-0 relative border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
      style={{ height: totalHeight }}
    >
      {hourMarkers.map((marker, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 flex items-center"
          style={{ top: marker.y }}
        >
          <span className="text-[10px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 px-1.5 -translate-y-1/2">
            {marker.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// FR14.1: One column per environment, with itineraries positioned on the timeline
function TimelineEnvColumn({
  envId,
  envIndex,
  comparisonResults,
  config,
  totalHeight,
  hourMarkers,
  isDark,
  hoveredItinerary,
  selectedItinerary,
  onHover,
  onSelect,
  onHoverLeg,
}: {
  envId: string;
  envIndex: number;
  comparisonResults: Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }>;
  config: TimelineConfig;
  totalHeight: number;
  hourMarkers: { y: number }[];
  isDark: boolean;
  hoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  selectedItinerary?: { envId: string; itineraryIndex: number } | null;
  onHover?: (envId: string, itineraryIndex: number | null) => void;
  onSelect?: (envId: string, itineraryIndex: number) => void;
  onHoverLeg?: (index: number | null) => void;
}) {
  const entry = comparisonResults[envId];
  const itineraries = entry?.result?.plan?.itineraries ?? [];
  const envColor = ENV_COLORS[envIndex] ?? "#888";

  if (entry?.error) {
    return (
      <div className="flex-1 flex items-center justify-center border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 p-3">
        <div className="text-center">
          <p className="text-xs text-red-500">Error</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 max-w-[150px] truncate">{entry.error.message}</p>
        </div>
      </div>
    );
  }

  // FR14.3: Sort by realtime departure time
  const sorted = [...itineraries]
    .map((it, originalIndex) => ({ itinerary: it, originalIndex }))
    .sort((a, b) => a.itinerary.startTime - b.itinerary.startTime);

  // Compute Y positions with overlap prevention: each card is ~80px tall + 8px gap
  const CARD_HEIGHT = 80;
  const CARD_GAP = 8;
  const positions: number[] = [];
  let nextAvailableY = 0;
  for (const { itinerary } of sorted) {
    const timeY = timeToY(itinerary.startTime, config);
    const y = Math.max(timeY, nextAvailableY);
    positions.push(y);
    nextAvailableY = y + CARD_HEIGHT + CARD_GAP;
  }

  return (
    <div
      className="flex-1 relative border-r last:border-r-0 border-zinc-200 dark:border-zinc-800"
      style={{ height: totalHeight }}
    >
      {/* Horizontal gridlines at hour markers */}
      {hourMarkers.map((marker, i) => (
        <div
          key={`grid-${i}`}
          className="absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-800/50 pointer-events-none"
          style={{ top: marker.y }}
        />
      ))}

      {/* Itinerary transfer scheme bars, positioned by start time with overlap prevention */}
      {sorted.map(({ itinerary, originalIndex }, sortedIdx) => {
        const y = positions[sortedIdx];
        const isHovered = hoveredItinerary?.envId === envId && hoveredItinerary?.itineraryIndex === originalIndex;
        const isSelected = selectedItinerary?.envId === envId && selectedItinerary?.itineraryIndex === originalIndex;

        return (
          <TimelineTransferScheme
            key={`${envId}-${originalIndex}`}
            itinerary={itinerary}
            envId={envId}
            itineraryIndex={originalIndex}
            y={y}
            envColor={envColor}
            isDark={isDark}
            isHovered={isHovered}
            isSelected={isSelected}
            onHover={onHover}
            onSelect={onSelect}
            onHoverLeg={onHoverLeg}
          />
        );
      })}
    </div>
  );
}

// FR14.4/14.5/14.6: Compact transfer scheme bar positioned on the timeline
function TimelineTransferScheme({
  itinerary,
  envId,
  itineraryIndex,
  y,
  envColor,
  isDark,
  isHovered,
  isSelected,
  onHover,
  onSelect,
  onHoverLeg,
}: {
  itinerary: Itinerary;
  envId: string;
  itineraryIndex: number;
  y: number;
  envColor: string;
  isDark: boolean;
  isHovered: boolean;
  isSelected: boolean;
  onHover?: (envId: string, itineraryIndex: number | null) => void;
  onSelect?: (envId: string, itineraryIndex: number) => void;
  onHoverLeg?: (index: number | null) => void;
}) {
  const walkColor = isDark ? "#ffffff" : "#1a1a1a";
  const totalDuration = itinerary.duration || 1;

  const depTime = itinerary.startTimeHHMM ?? formatTimestamp(itinerary.startTime);
  const arrTime = itinerary.endTimeHHMM ?? formatTimestamp(itinerary.endTime);
  const duration = itinerary.durationHHMM ?? formatDuration(itinerary.duration);
  const products = getUniqueProducts(itinerary.legs);

  return (
    <div
      className={`absolute left-1 right-1 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "border-lvb-yellow bg-yellow-50/80 dark:bg-yellow-950/30 shadow-md z-20"
          : isHovered
          ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-800 shadow-sm z-10"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 z-0"
      }`}
      style={{ top: y }}
      onMouseEnter={() => onHover?.(envId, itineraryIndex)}
      onMouseLeave={() => onHover?.(envId, null)}
      onClick={() => onSelect?.(envId, itineraryIndex)}
    >
      {/* Left accent bar showing env color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
        style={{ backgroundColor: envColor }}
      />

      {/* Compact view: time + transfer scheme + products */}
      <div className="px-2 py-1.5 pl-2.5">
        {/* Times + duration */}
        <div className="flex items-center gap-1.5 text-[10px] mb-1">
          <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-100">
            {depTime}
          </span>
          <svg className="w-2.5 h-2.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-100">
            {arrTime}
          </span>
          <span className="ml-auto text-zinc-400 dark:text-zinc-500">{duration}</span>
        </div>

        {/* FR14.4: Transfer scheme bar (proportional leg segments) */}
        <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {itinerary.legs.map((leg, i) => {
            const pct = Math.max((leg.duration / totalDuration) * 100, 2);
            const isWalk = !leg.transitLeg;
            return (
              <div
                key={i}
                className="h-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isWalk ? walkColor : getLegColor(leg),
                  opacity: isWalk ? 0.5 : 1,
                }}
                title={`${MODE_LABELS[leg.mode] ?? leg.mode}${leg.transitLeg ? ` ${leg.routeShortName}` : ""}`}
              />
            );
          })}
        </div>

        {/* Product badges */}
        {products.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {products.map((p, i) => (
              <span
                key={i}
                className="px-1 py-0 rounded text-[9px] text-white font-medium leading-tight"
                style={{ backgroundColor: p.color }}
              >
                {p.label} {p.routeName}
              </span>
            ))}
            {itinerary.transfers > 0 && (
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 ml-auto">
                {itinerary.transfers} transfer{itinerary.transfers > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* FR14.6: Expanded detail view when selected (click to open) */}
      {isSelected && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          <ItineraryCard
            itinerary={itinerary}
            index={itineraryIndex}
            isSelected={true}
            onSelect={() => {}}
            onHoverLeg={onHoverLeg}
          />
        </div>
      )}
    </div>
  );
}
