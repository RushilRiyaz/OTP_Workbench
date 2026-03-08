"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import Tabs, { TabId } from "./Tabs";
import { LocationValue } from "./LocationInput";
import Map from "./map/DynamicMapLoader";
import ErrorBoundary from "./ErrorBoundary";
import RoutingResults from "./RoutingResults";
import type { RoutingResponse, RoutingError, Itinerary } from "@/lib/routing";
import type { Environment } from "./EnvironmentSelector";
import type { ComparisonItineraryRef, DetailHoveredLeg, ComparisonMapItinerary } from "./comparison/types";
import { ITINERARY_COLORS } from "./comparison/types";
import { ComparisonEmptyState } from "./comparison/ComparisonEmptyState";
import { TimelineComparisonLayout } from "./comparison/TimelineComparisonLayout";
import { ComparisonOverviewLayout } from "./comparison/ComparisonOverviewLayout";
import { DetailComparisonLayout } from "./comparison/DetailComparisonLayout";
import StopMonitorResults from "./StopMonitorResults";
import type { StopMonitorEnvState } from "@/lib/stopMonitor";
import type { LocationValue as LV } from "./LocationInput";
import StopMonitorMap from "./map/DynamicStopMonitorMapLoader";
import type { StopsItem } from "@/lib/stopMonitor";

type SplitLayout = "vertical" | "horizontal";
// FR13: Three comparison layout modes
type ComparisonLayout = "horizontal" | "vertical" | "overview";

// Extracted as a named component to avoid IIFE-in-JSX pattern
function StopMonitorTabView({
  smResults, smSelectedEnvs, smStop, smDateTime, smArrOnly, smDepOnly,
  smSelectedStopId, smStopMonitorUrl, smApiKey, customEnvironments,
  onStopMonitorMore, onSmClear, onSmStopSelect, mapError,
}: {
  smResults?: Record<string, StopMonitorEnvState>;
  smSelectedEnvs?: string[];
  smStop?: LV;
  smDateTime?: string;
  smArrOnly?: boolean;
  smDepOnly?: boolean;
  smSelectedStopId?: string | null;
  smStopMonitorUrl?: string;
  smApiKey?: string;
  customEnvironments?: Environment[];
  onStopMonitorMore?: (envId: string) => void;
  onSmClear?: () => void;
  onSmStopSelect?: (stop: StopsItem) => void;
  mapError: string;
}) {
  const hasSmResults = Object.keys(smResults ?? {}).length > 0;
  const numEnvs = Math.max(1, Object.keys(smResults ?? {}).length);
  const cardWidth = numEnvs === 1 ? 420 : numEnvs === 2 ? 780 : 1120;
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      {/* Full-width map */}
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{mapError}</p>
          </div>
        }
      >
        <StopMonitorMap
          selectedStopId={smSelectedStopId ?? null}
          onStopSelect={onSmStopSelect ?? (() => {})}
          stopMonitorUrl={smStopMonitorUrl ?? ""}
          apiKey={smApiKey ?? ""}
        />
      </ErrorBoundary>

      {/* Floating results card — slides in from right, expands with more envs */}
      <div
        style={{ zIndex: 1000, width: `${cardWidth}px` }}
        className={`absolute top-3 bottom-3 right-3 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md transition-all duration-300 ease-out ${
          hasSmResults
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-8 pointer-events-none"
        }`}
      >
        <StopMonitorResults
          selectedEnvironments={smSelectedEnvs ?? []}
          customEnvironments={customEnvironments ?? []}
          results={smResults ?? {}}
          stopName={smStop?.text ?? ""}
          dateTime={smDateTime ?? ""}
          onMore={onStopMonitorMore ?? (() => {})}
          onClear={onSmClear ?? (() => {})}
          arrOnly={smArrOnly}
          depOnly={smDepOnly}
        />
      </div>
    </div>
  );
}

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
  // FR14/FR17: Comparison interaction props
  comparisonHoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  comparisonSelectedItineraries?: ComparisonItineraryRef[];
  comparisonMapItineraries?: ComparisonMapItinerary[];
  comparisonHoveredLegIndex?: number | null;
  onComparisonHover?: (envId: string, itineraryIndex: number | null) => void;
  onComparisonToggleSelect?: (envId: string, itineraryIndex: number) => void;
  onComparisonHoverLeg?: (index: number | null) => void;
  // FR17: Detail comparison
  isDetailComparisonView?: boolean;
  detailHoveredLeg?: DetailHoveredLeg | null;
  onEnterDetailView?: () => void;
  onExitDetailView?: () => void;
  onDetailHoverLeg?: (leg: DetailHoveredLeg | null) => void;
  // FR18-FR21: Stop Monitor
  smResults?: Record<string, StopMonitorEnvState>;
  smSelectedEnvs?: string[];
  smStop?: LV;
  smDateTime?: string;
  smArrOnly?: boolean;
  smDepOnly?: boolean;
  onStopMonitorMore?: (envId: string) => void;
  smStopMonitorUrl?: string;
  smApiKey?: string;
  smSelectedStopId?: string | null;
  onSmStopSelect?: (stop: StopsItem) => void;
  onSmClear?: () => void;
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
  comparisonSelectedItineraries,
  comparisonMapItineraries,
  comparisonHoveredLegIndex,
  onComparisonHover,
  onComparisonToggleSelect,
  onComparisonHoverLeg,
  isDetailComparisonView,
  detailHoveredLeg,
  onEnterDetailView,
  onExitDetailView,
  onDetailHoverLeg,
  smResults,
  smSelectedEnvs,
  smStop,
  smDateTime,
  smArrOnly,
  smDepOnly,
  onStopMonitorMore,
  smStopMonitorUrl,
  smApiKey,
  smSelectedStopId,
  onSmStopSelect,
  onSmClear,
}: EvaluationAreaProps) {
  const t = useTranslations("EvaluationArea");
  const tDetail = useTranslations("DetailComparison");
  const itineraries = routingResult?.plan?.itineraries ?? [];
  const selectedItinerary: Itinerary | null =
    itineraries[selectedItineraryIndex] ?? null;
  const hasResults = itineraries.length > 0;
  const hasComparisonResults = Object.keys(comparisonResults ?? {}).length > 0;

  const [layout, setLayout] = useState<SplitLayout>("vertical");
  const [comparisonLayout, setComparisonLayout] = useState<ComparisonLayout>("horizontal"); // FR13.1: default
  const [mapPct, setMapPct] = useState(DEFAULT_MAP_PCT);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSmClearConfirm, setShowSmClearConfirm] = useState(false);
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

  // FR14/FR17: Whether the comparison map should auto-fit bounds
  const comparisonAutoFitBounds = comparisonHoveredItinerary === null;

  // FR17: Derive single itinerary for non-detail map mode (backward compat)
  const comparisonMapItinerary = (!isDetailComparisonView && (comparisonMapItineraries?.length ?? 0) > 0)
    ? comparisonMapItineraries![0].itinerary
    : null;

  return (
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <Tabs activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "routing" && (
          <div className="flex flex-col h-full">
            {/* Layout toggle button — only show when results present */}
            {hasResults && (
              <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-100 dark:border-zinc-800">
                {/* Clear results */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                  title={t("clearTitle")}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{t("clear")}</span>
                </button>
                {/* Layout toggle */}
                <button
                  type="button"
                  onClick={toggleLayout}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                  title={isVertical ? t("switchToSideBySide") : t("switchToStacked")}
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
                  <span>{isVertical ? t("sideBySide") : t("stacked")}</span>
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
                        {t("mapError")}
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
                    stopMonitorUrl={smStopMonitorUrl}
                    apiKey={smApiKey}
                  />
                </ErrorBoundary>
              </div>

              {/* Drag divider */}
              {hasResults && (
                <div
                  onMouseDown={handleDragStart}
                  className={`group flex-shrink-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors ${
                    isVertical
                      ? "h-1 cursor-row-resize border-y border-zinc-200/50 dark:border-zinc-700/50"
                      : "w-1 cursor-col-resize border-x border-zinc-200/50 dark:border-zinc-700/50"
                  }`}
                >
                  {/* Grip pill */}
                  <div className={`rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500 transition-colors ${isVertical ? "w-8 h-0.5" : "w-0.5 h-8"}`} />
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
            {/* Show empty state when fewer than 2 environments selected */}
            {(selectedEnvironments?.length ?? 0) < 2 && (
              <ComparisonEmptyState selectedEnvironments={selectedEnvironments ?? []} />
            )}

            {/* Show map + comparison layouts once 2+ environments are selected */}
            {(selectedEnvironments?.length ?? 0) >= 2 && (<>
            {/* Toolbar: clear + compare button + layout toggle — only show when comparison has results */}
            {hasComparisonResults && (
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {/* Clear results */}
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                    title={t("clearTitle")}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{t("clear")}</span>
                  </button>

                  {/* FR17: Compare Selected button — visible when itineraries selected */}
                  {(comparisonSelectedItineraries?.length ?? 0) > 0 && !isDetailComparisonView && (
                    <button
                      type="button"
                      onClick={onEnterDetailView}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                      style={{ backgroundColor: ITINERARY_COLORS[0] }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {tDetail("compareSelected", { count: comparisonSelectedItineraries?.length ?? 0 })}
                    </button>
                  )}
                </div>
                {/* Layout toggle */}
                <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-0.5">
                  {([
                    { id: "horizontal" as const, label: t("horizontal") },
                    { id: "vertical" as const, label: t("vertical") },
                    { id: "overview" as const, label: t("overview") },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setComparisonLayout(opt.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                        comparisonLayout === opt.id
                          ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/50"
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
                        {t("mapError")}
                      </p>
                    </div>
                  }
                >
                  <Map
                    start={startLocation}
                    destination={destinationLocation}
                    onStartChange={onStartChange}
                    onDestinationChange={onDestinationChange}
                    selectedItinerary={isDetailComparisonView ? null : comparisonMapItinerary}
                    hoveredLegIndex={isDetailComparisonView ? null : (comparisonHoveredLegIndex ?? null)}
                    autoFitBounds={comparisonAutoFitBounds}
                    comparisonItineraries={isDetailComparisonView ? comparisonMapItineraries : undefined}
                    comparisonHoveredLeg={isDetailComparisonView ? detailHoveredLeg : undefined}
                    stopMonitorUrl={smStopMonitorUrl}
                    apiKey={smApiKey}
                  />
                </ErrorBoundary>
              </div>

              {/* Drag divider */}
              {hasComparisonResults && (
                <div
                  onMouseDown={handleDragStart}
                  className="group flex-shrink-0 flex items-center justify-center h-1 cursor-row-resize border-y border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-colors"
                >
                  <div className="w-8 h-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-500 transition-colors" />
                </div>
              )}

              {/* Comparison content panel */}
              {hasComparisonResults && (
                <div
                  className="min-h-0 min-w-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col"
                  style={{ height: `${100 - mapPct}%` }}
                >
                  {isDetailComparisonView ? (
                    <DetailComparisonLayout
                      items={comparisonSelectedItineraries ?? []}
                      comparisonResults={comparisonResults ?? {}}
                      customEnvironments={customEnvironments ?? []}
                      onDeselectItem={(ref) => onComparisonToggleSelect?.(ref.envId, ref.itineraryIndex)}
                      onDeselectAll={onExitDetailView ?? (() => {})}
                      onHoverLeg={onDetailHoverLeg ?? (() => {})}
                    />
                  ) : comparisonLayout === "overview" ? (
                    <ComparisonOverviewLayout
                      comparisonResults={comparisonResults ?? {}}
                      selectedEnvironments={selectedEnvironments ?? []}
                      customEnvironments={customEnvironments ?? []}
                      comparisonHoveredItinerary={comparisonHoveredItinerary}
                      comparisonSelectedItineraries={comparisonSelectedItineraries}
                      onComparisonHover={onComparisonHover}
                      onComparisonToggleSelect={onComparisonToggleSelect}
                      onComparisonHoverLeg={onComparisonHoverLeg}
                    />
                  ) : (
                    <TimelineComparisonLayout
                      mode={comparisonLayout}
                      comparisonResults={comparisonResults ?? {}}
                      selectedEnvironments={selectedEnvironments ?? []}
                      customEnvironments={customEnvironments ?? []}
                      comparisonHoveredItinerary={comparisonHoveredItinerary}
                      comparisonSelectedItineraries={comparisonSelectedItineraries}
                      onComparisonHover={onComparisonHover}
                      onComparisonToggleSelect={onComparisonToggleSelect}
                      onComparisonHoverLeg={onComparisonHoverLeg}
                    />
                  )}
                </div>
              )}

              {/* Empty state when environments selected but no results yet */}
              {!hasComparisonResults && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    {t("submitToCompare")}
                  </p>
                </div>
              )}
            </div>
            </>)}
          </div>
        )}

        {/* FR19: Stop Monitor tab — full-width map with floating results card */}
        {activeTab === "stopmonitor" && (
          <StopMonitorTabView
            smResults={smResults}
            smSelectedEnvs={smSelectedEnvs}
            smStop={smStop}
            smDateTime={smDateTime}
            smArrOnly={smArrOnly}
            smDepOnly={smDepOnly}
            smSelectedStopId={smSelectedStopId}
            smStopMonitorUrl={smStopMonitorUrl}
            smApiKey={smApiKey}
            customEnvironments={customEnvironments}
            onStopMonitorMore={onStopMonitorMore}
            onSmClear={() => setShowSmClearConfirm(true)}
            onSmStopSelect={onSmStopSelect}
            mapError={t("mapError")}
          />
        )}

        {activeTab !== "routing" && activeTab !== "routing-comparison" && activeTab !== "stopmonitor" && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("comingSoon")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("featureInDevelopment", { tab: activeTab })}</p>
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
              {t("clearConfirmTitle")}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              {t("clearConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearResults?.();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t("clear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Monitor clear confirmation dialog */}
      {showSmClearConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-5 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {t("clearConfirmTitle")}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              {t("clearConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSmClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSmClearConfirm(false);
                  onSmClear?.();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t("clear")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
