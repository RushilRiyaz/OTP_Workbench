"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import ParameterArea from "@/components/ParameterArea";
import EvaluationArea from "@/components/EvaluationArea";
import JourneyForm from "@/components/JourneyForm";
import EnvironmentSelector, { Environment } from "@/components/EnvironmentSelector";
import { TabId } from "@/components/Tabs";
import { LocationValue, emptyLocationValue } from "@/components/LocationInput";
import { RoutingOptions, defaultRoutingOptions } from "@/components/RoutingOptionsForm";
import { ValidationError, RequestHistoryEntry } from "@/lib/types";
import { validateRoutingParams } from "@/lib/validation";
import { fetchRouting, RoutingResponse, RoutingError, Itinerary } from "@/lib/routing";
import { getRequestHistory, addToRequestHistory, clearRequestHistory, generateDisplayLabel } from "@/lib/requestHistory";
import { serializeFormState, deserializeUrlParams } from "@/lib/urlParams";
import { getEnvironmentConfig, getAutocompleteConfig, getStopMonitorConfig } from "@/components/EnvironmentSelector";
import type { ComparisonItineraryRef, DetailHoveredLeg, ComparisonMapItinerary } from "@/components/comparison/types";
import { ITINERARY_COLORS, ENV_COLORS } from "@/components/comparison/types";
import { toggleComparisonSelection } from "@/lib/comparisonSelectionUtils";
import { fetchStopMonitor, formatDateForMonitor, formatTimeForMonitor, StopMonitorEnvState } from "@/lib/stopMonitor";
import type { StopsItem } from "@/lib/stopMonitor";
import { validateStopMonitorParams } from "@/lib/validation";
import { getBerlinNow } from "@/components/DateTimeInput";
import StopMonitorForm from "@/components/StopMonitorForm";
import StopMonitorResults from "@/components/StopMonitorResults";


/** NFR-SM-BUG1: Resolve the correct stopId/koord string for the Stop Monitor API.
 *  Transit stops: use GTFS stop_id from autocomplete tags (or parse from id).
 *  Non-transit / coordinates: fall back to koord=lat,lon.
 */
function getStopIdForMonitor(stop: LocationValue): string {
  if (stop.type === "stopId" && stop.stopId) {
    const id = stop.stopId.trim();
    return id.endsWith("_parent") ? id : `${id}_parent`;
  }
  if (stop.type === "autocomplete" && stop.location) {
    const loc = stop.location;
    if (loc.ptype === "S") {
      // Transit stop — prefer GTFS stop_id from tags
      const tagStopId = loc.tags?.stop_id;
      if (tagStopId) {
        const id = String(tagStopId);
        return id.endsWith("_parent") ? id : `${id}_parent`;
      }
      // Fallback: parse "pois_g|0011078" → "0011078_parent"
      const parts = loc.id?.split("|");
      if (parts && parts.length >= 2 && parts[1]) {
        return `${parts[1]}_parent`;
      }
    }
    // Non-transit (POI, address): best-effort via coordinates
    return `koord=${loc.lat},${loc.lon}`;
  }
  if (stop.type === "coordinates" && stop.coordinates) {
    return `koord=${stop.coordinates.lat},${stop.coordinates.lon}`;
  }
  return "";
}

export default function Home() {
  const t = useTranslations("JourneyForm");

  // Shared state: active tab
  const [activeTab, setActiveTab] = useState<TabId>("routing");

  // Environment selection state
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(["prod"]); // FR3.6: PROD preselected
  const [customEnvironments, setCustomEnvironments] = useState<Environment[]>([]);
  const [selectedAutocompleteEnv, setSelectedAutocompleteEnv] = useState<string>("prod");

  // Journey state - lifted from JourneyForm for map interaction (FR8)
  const [startLocation, setStartLocation] = useState<LocationValue>(emptyLocationValue);
  const [destinationLocation, setDestinationLocation] = useState<LocationValue>(emptyLocationValue);

  // FR6: Lifted state from JourneyForm
  const [dateTime, setDateTime] = useState<string>(() => {
    // Use Europe/Berlin (GMT+1/+2) instead of UTC
    const now = new Date();
    const berlinStr = now.toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
    // sv-SE locale produces "yyyy-MM-dd HH:mm:ss" — take the first 16 chars for datetime-local
    return berlinStr.slice(0, 16).replace(" ", "T");
  });
  const [routingOptions, setRoutingOptions] = useState<RoutingOptions>(defaultRoutingOptions);

  // FR6: Request state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [routingResult, setRoutingResult] = useState<RoutingResponse | null>(null);
  const [routingError, setRoutingError] = useState<RoutingError | null>(null);

  // Selected itinerary index for results display
  const [selectedItineraryIndex, setSelectedItineraryIndex] = useState<number>(0);

  // FR13: Comparison results — one entry per selected environment
  const [comparisonResults, setComparisonResults] = useState<
    Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }>
  >({});

  // FR11.8: Hovered leg index for map polyline highlighting
  const [hoveredLegIndex, setHoveredLegIndex] = useState<number | null>(null);

  // FR14.5/14.6: Comparison interaction state — hovered itinerary + leg hover
  const [comparisonHoveredItinerary, setComparisonHoveredItinerary] = useState<{
    envId: string;
    itineraryIndex: number;
  } | null>(null);
  const [comparisonHoveredLegIndex, setComparisonHoveredLegIndex] = useState<number | null>(null);

  // FR17.1: Multi-select for detail comparison (up to 3)
  const [comparisonSelectedItineraries, setComparisonSelectedItineraries] = useState<ComparisonItineraryRef[]>([]);
  const [detailHoveredLeg, setDetailHoveredLeg] = useState<DetailHoveredLeg | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const isDetailComparisonView = showDetailView && comparisonSelectedItineraries.length > 0;

  // FR17.4: Derive itineraries for map — detail mode shows all selected, overview shows hovered
  const comparisonMapItineraries = useMemo((): ComparisonMapItinerary[] => {
    if (isDetailComparisonView) {
      // Detail mode: show all selected itineraries with ITINERARY_COLORS
      const items: ComparisonMapItinerary[] = [];
      for (let i = 0; i < comparisonSelectedItineraries.length; i++) {
        const ref = comparisonSelectedItineraries[i];
        const it = comparisonResults[ref.envId]?.result?.plan?.itineraries?.[ref.itineraryIndex];
        if (it) items.push({ itinerary: it, color: ITINERARY_COLORS[i] ?? "#888" });
      }
      return items;
    }
    // Overview mode: show hovered itinerary with env color
    if (comparisonHoveredItinerary) {
      const it = comparisonResults[comparisonHoveredItinerary.envId]?.result?.plan?.itineraries?.[comparisonHoveredItinerary.itineraryIndex];
      if (it) {
        const envIndex = selectedEnvironments.indexOf(comparisonHoveredItinerary.envId);
        return [{ itinerary: it, color: ENV_COLORS[envIndex] ?? "#888" }];
      }
    }
    return [];
  }, [isDetailComparisonView, comparisonSelectedItineraries, comparisonHoveredItinerary, comparisonResults, selectedEnvironments]);

  // Reset hover when itinerary selection changes
  const handleSelectItinerary = useCallback((index: number) => {
    setSelectedItineraryIndex(index);
    setHoveredLegIndex(null);
  }, []);

  // FR14.5: Comparison hover — update map with hovered itinerary
  const handleComparisonHover = useCallback((envId: string, itineraryIndex: number | null) => {
    if (itineraryIndex === null) {
      setComparisonHoveredItinerary(null);
    } else {
      setComparisonHoveredItinerary({ envId, itineraryIndex });
    }
    setComparisonHoveredLegIndex(null);
  }, []);

  // FR17.1: Toggle itinerary in/out of detail comparison (cap at 3)
  const handleComparisonToggleSelect = useCallback((envId: string, itineraryIndex: number) => {
    setComparisonSelectedItineraries((prev) => toggleComparisonSelection(prev, envId, itineraryIndex));
    setDetailHoveredLeg(null);
    setComparisonHoveredLegIndex(null);
  }, []);

  // FR17.5: Enter/exit detail comparison view (selections preserved on exit)
  const handleEnterDetailView = useCallback(() => {
    setShowDetailView(true);
  }, []);

  const handleExitDetailView = useCallback(() => {
    setShowDetailView(false);
    setDetailHoveredLeg(null);
  }, []);

  // FR17: Set detail hovered leg
  const handleDetailHoverLeg = useCallback((leg: DetailHoveredLeg | null) => {
    setDetailHoveredLeg(leg);
  }, []);

  // FR18: Stop Monitor state (NFR-SM4.1: lifted to page.tsx)
  const [smStop, setSmStop] = useState<LocationValue>(emptyLocationValue);
  const [smDateTime, setSmDateTime] = useState<string>(() => getBerlinNow());
  const [smArrOnly, setSmArrOnly] = useState(false);
  const [smDepOnly, setSmDepOnly] = useState(false);
  const [smSelectedEnvs, setSmSelectedEnvs] = useState<string[]>(["prod"]);
  const [smValidationErrors, setSmValidationErrors] = useState<ValidationError[]>([]);
  const [smResults, setSmResults] = useState<Record<string, StopMonitorEnvState>>({});

  // FR18.7: Submit stop monitor request (parallel per env — NFR-SM5.1)
  const handleStopMonitorSubmit = useCallback(async () => {
    setSmValidationErrors([]);

    const errors = validateStopMonitorParams({ stop: smStop, dateTime: smDateTime });
    if (errors.length > 0) {
      setSmValidationErrors(errors);
      return;
    }

    const stopId = getStopIdForMonitor(smStop);
    if (!stopId) return;

    const date = formatDateForMonitor(smDateTime);
    const time = formatTimeForMonitor(smDateTime);

    // Initialize all envs to loading state
    const initialState: Record<string, StopMonitorEnvState> = {};
    for (const envId of smSelectedEnvs) {
      initialState[envId] = { data: null, error: null, isLoading: true, isLoadingMore: false, minutes: 60 };
    }
    setSmResults(initialState);

    // NFR-SM5.1: Parallel fetch per environment
    const promises = smSelectedEnvs.map(async (envId) => {
      try {
        const { stopMonitorUrl, apiKey } = getStopMonitorConfig(envId, customEnvironments);
        const result = await fetchStopMonitor(
          { stopId, date, time, minutes: 60, arrOnly: smArrOnly || undefined, depOnly: smDepOnly || undefined },
          { baseUrl: stopMonitorUrl, apiKey }
        );
        return { envId, result };
      } catch (err) {
        console.error(`[StopMonitor] Unexpected error for ${envId}:`, err);
        return {
          envId,
          result: {
            success: false as const,
            error: { type: "network" as const, message: err instanceof Error ? err.message : "Unexpected error" },
          },
        };
      }
    });

    const settled = await Promise.all(promises);
    const nextState: Record<string, StopMonitorEnvState> = {};
    for (const { envId, result } of settled) {
      if (result.success) {
        nextState[envId] = { data: result.data, error: null, isLoading: false, isLoadingMore: false, minutes: 60 };
      } else {
        nextState[envId] = { data: null, error: result.error, isLoading: false, isLoadingMore: false, minutes: 60 };
      }
    }
    setSmResults(nextState);
  }, [smStop, smDateTime, smArrOnly, smDepOnly, smSelectedEnvs, customEnvironments]);

  // FR19.3: "More" — extend time window by 60 min and re-fetch, appending new items
  const handleStopMonitorMore = useCallback(async (envId: string) => {
    const current = smResults[envId];
    if (!current || current.isLoading || current.isLoadingMore) return;

    const stopId = getStopIdForMonitor(smStop);
    if (!stopId) return;

    const newMinutes = current.minutes + 60;
    setSmResults((prev) => ({
      ...prev,
      [envId]: { ...prev[envId], isLoadingMore: true },
    }));

    try {
      const { stopMonitorUrl, apiKey } = getStopMonitorConfig(envId, customEnvironments);
      const result = await fetchStopMonitor(
        {
          stopId,
          date: formatDateForMonitor(smDateTime),
          time: formatTimeForMonitor(smDateTime),
          minutes: newMinutes,
          arrOnly: smArrOnly || undefined,
          depOnly: smDepOnly || undefined,
        },
        { baseUrl: stopMonitorUrl, apiKey }
      );

      if (result.success) {
        // FR19.3.2: Dedup by trip_id + stop_id, then replace with full new result
        const existingKeys = new Set(
          (current.data ?? []).map((item) => `${item.trip_id}|${item.stop_id}`)
        );
        const newItems = result.data.filter(
          (item) => !existingKeys.has(`${item.trip_id}|${item.stop_id}`)
        );
        setSmResults((prev) => ({
          ...prev,
          [envId]: {
            ...prev[envId],
            data: [...(current.data ?? []), ...newItems],
            isLoadingMore: false,
            minutes: newMinutes,
          },
        }));
      } else {
        setSmResults((prev) => ({
          ...prev,
          [envId]: { ...prev[envId], isLoadingMore: false },
        }));
      }
    } catch {
      setSmResults((prev) => ({
        ...prev,
        [envId]: { ...prev[envId], isLoadingMore: false },
      }));
    }
  }, [smResults, smStop, smDateTime, smArrOnly, smDepOnly, customEnvironments]);

  // FR6.4: Request history (loaded from localStorage)
  const [requestHistory, setRequestHistory] = useState<RequestHistoryEntry[]>([]);

  // FR6.6: URL sync state
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [linkCopied, setLinkCopied] = useState<"success" | "error" | null>(null);
  const urlUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if single select mode based on active tab
  // FR3.5: Single environment only when Routing use case selected
  const singleSelectMode = activeTab === "routing";

  // FR3.5: When switching to single-select mode, keep only first selection
  useEffect(() => {
    if (singleSelectMode) {
      setSelectedEnvironments((prev) => (prev.length > 1 ? [prev[0]] : prev));
    }
  }, [singleSelectMode]);

  // Auto-sync autocomplete env when OTP env changes (for predefined envs)
  const handleEnvironmentChange = useCallback((selectedIds: string[]) => {
    setSelectedEnvironments(selectedIds);
    const newEnvId = selectedIds[0];
    // Auto-match autocomplete to OTP selection for predefined envs
    if (newEnvId && ["prod", "stage", "dev"].includes(newEnvId)) {
      setSelectedAutocompleteEnv(newEnvId);
    }
  }, []);

  // FR6.4: Load request history from localStorage on mount
  useEffect(() => {
    setRequestHistory(getRequestHistory());
  }, []);

  // FR6.6: Read URL params on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.toString()) {
      const parsed = deserializeUrlParams(searchParams);

      if (parsed.start) setStartLocation(parsed.start);
      if (parsed.destination) setDestinationLocation(parsed.destination);
      if (parsed.dateTime) setDateTime(parsed.dateTime);
      if (parsed.routingOptions) setRoutingOptions(parsed.routingOptions);
      if (parsed.selectedEnvironment) setSelectedEnvironments([parsed.selectedEnvironment]);
      if (parsed.selectedAutocompleteEnv) setSelectedAutocompleteEnv(parsed.selectedAutocompleteEnv);
      if (parsed.customEnvironments) setCustomEnvironments(parsed.customEnvironments);
    }

    setUrlInitialized(true);
  }, []);

  // FR6.6: Update URL when form state changes (debounced)
  useEffect(() => {
    if (!urlInitialized) return;
    if (typeof window === "undefined") return;

    // Clear previous timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    // Debounce URL update
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const queryString = serializeFormState({
        start: startLocation,
        destination: destinationLocation,
        dateTime,
        routingOptions,
        selectedEnvironment: selectedEnvironments[0] || "prod",
        selectedAutocompleteEnv,
        customEnvironments,
      });

      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      window.history.replaceState(null, "", newUrl);
    }, 300);

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [urlInitialized, startLocation, destinationLocation, dateTime, routingOptions, selectedEnvironments, selectedAutocompleteEnv, customEnvironments]);

  // FR6.6: Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied("success");
      setTimeout(() => setLinkCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      setLinkCopied("error");
      setTimeout(() => setLinkCopied(null), 2000);
    }
  }, []);

  const handleAddCustomEnvironment = (env: Environment) => {
    setCustomEnvironments((prev) => [...prev, env]);
  };

  const handleRemoveCustomEnvironment = (envId: string) => {
    setCustomEnvironments((prev) => prev.filter((e) => e.id !== envId));
  };

  // FR6.1: Start routing request
  const handleSubmitRouting = async () => {
    // Clear previous errors and results
    setValidationErrors([]);
    setRoutingError(null);

    // FR6.2: Validate mandatory inputs
    const errors = validateRoutingParams({
      start: startLocation,
      destination: destinationLocation,
      dateTime,
      routingOptions,
    });

    // FR6.3: Display error if mandatory fields missing
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Start request
    setIsLoading(true);
    setRoutingResult(null);

    try {
      const envConfig = getEnvironmentConfig(selectedEnvironments[0] || "prod", customEnvironments);
      const result = await fetchRouting(
        {
          start: startLocation,
          destination: destinationLocation,
          dateTime,
          routingOptions,
        },
        undefined,
        { baseUrl: envConfig.otpUrl, apiKey: envConfig.apiKey }
      );

      if (result.success) {
        setRoutingResult(result.data);
        setSelectedItineraryIndex(0);

        // FR6.4: Save to request history
        const historyEntry: RequestHistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          start: startLocation,
          destination: destinationLocation,
          dateTime,
          routingOptions,
          selectedEnvironment: selectedEnvironments[0] || "prod",
          selectedAutocompleteEnv,
          displayLabel: generateDisplayLabel(startLocation, destinationLocation),
        };
        addToRequestHistory(historyEntry);
        setRequestHistory(getRequestHistory());
      } else {
        setRoutingError(result.error);
        console.error("[Routing] Error:", result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // FR13: Comparison submit — fetch routing for all selected environments concurrently
  const handleComparisonSubmit = async () => {
    setValidationErrors([]);

    const errors = validateRoutingParams({
      start: startLocation,
      destination: destinationLocation,
      dateTime,
      routingOptions,
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (selectedEnvironments.length === 0) return;

    // FR17: Clear stale selections before new results arrive
    setComparisonSelectedItineraries([]);
    setShowDetailView(false);
    setDetailHoveredLeg(null);

    // Set all envs to loading
    const initialState: Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }> = {};
    for (const envId of selectedEnvironments) {
      initialState[envId] = { result: null, error: null, isLoading: true };
    }
    setComparisonResults(initialState);
    setIsLoading(true);

    // Fetch concurrently for each environment
    // Wrap in try/catch so promises never reject — envId is always preserved
    const promises = selectedEnvironments.map(async (envId) => {
      try {
        const envConfig = getEnvironmentConfig(envId, customEnvironments);
        const result = await fetchRouting(
          {
            start: startLocation,
            destination: destinationLocation,
            dateTime,
            routingOptions,
          },
          undefined,
          { baseUrl: envConfig.otpUrl, apiKey: envConfig.apiKey }
        );
        return { envId, result };
      } catch (err) {
        console.error(`[Comparison] Unexpected error for ${envId}:`, err);
        const error: RoutingError = {
          type: "network",
          message: err instanceof Error ? err.message : "Unexpected error",
        };
        return { envId, result: { success: false as const, error } };
      }
    });

    const results = await Promise.all(promises);

    const nextState: Record<string, { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }> = {};
    for (const { envId, result } of results) {
      if (result.success) {
        nextState[envId] = { result: result.data, error: null, isLoading: false };
      } else {
        nextState[envId] = { result: null, error: result.error, isLoading: false };
      }
    }

    setComparisonResults(nextState);
    setIsLoading(false);
  };

  // FR6.5: Load historical request (overwrites current, no warning)
  const handleLoadRequest = (entry: RequestHistoryEntry) => {
    setStartLocation(entry.start);
    setDestinationLocation(entry.destination);
    setDateTime(entry.dateTime);
    setRoutingOptions(entry.routingOptions);
    // Preserve selected environments when on comparison tab
    if (activeTab !== "routing-comparison") {
      setSelectedEnvironments([entry.selectedEnvironment]);
    }
    setSelectedAutocompleteEnv(entry.selectedAutocompleteEnv || entry.selectedEnvironment);
    // Clear any previous errors/results
    setValidationErrors([]);
    setRoutingError(null);
    setRoutingResult(null);
  };

  // FR6.4: Clear request history
  const handleClearHistory = () => {
    clearRequestHistory();
    setRequestHistory([]);
  };

  // Clear routing results and return to map-only view
  const handleClearResults = useCallback(() => {
    setRoutingResult(null);
    setComparisonResults({});
    setSelectedItineraryIndex(0);
    setHoveredLegIndex(null);
    // FR14/FR17: Reset comparison interaction state
    setComparisonHoveredItinerary(null);
    setComparisonSelectedItineraries([]);
    setShowDetailView(false);
    setDetailHoveredLeg(null);
    setComparisonHoveredLegIndex(null);
  }, []);

  // FR12.5: Load earlier/later itineraries
  const handleLoadMore = useCallback(async (direction: "earlier" | "later") => {
    if (!routingResult?.plan?.itineraries?.length) return;

    const itineraries = routingResult.plan.itineraries;
    const refItinerary = direction === "earlier"
      ? itineraries[0]
      : itineraries[itineraries.length - 1];

    // Shift time by 1 minute in the appropriate direction
    const refTime = direction === "earlier" ? refItinerary.startTime : refItinerary.endTime;
    const shiftedDate = new Date(refTime + (direction === "later" ? 60000 : -60000));

    const berlinStr = shiftedDate.toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
    const adjustedDateTime = berlinStr.slice(0, 16).replace(" ", "T");

    // Build modified routing options for earlier (arriveBy)
    const modifiedOptions = direction === "earlier"
      ? { ...routingOptions, timingMode: "arriveBy" as const }
      : { ...routingOptions, timingMode: "departAt" as const };

    const envConfig = getEnvironmentConfig(selectedEnvironments[0] || "prod", customEnvironments);
    const result = await fetchRouting(
      {
        start: startLocation,
        destination: destinationLocation,
        dateTime: adjustedDateTime,
        routingOptions: modifiedOptions,
      },
      undefined,
      { baseUrl: envConfig.otpUrl, apiKey: envConfig.apiKey }
    );

    if (!result.success || !result.data.plan?.itineraries?.length) return;

    const newItineraries = result.data.plan.itineraries;

    // Deduplicate by startTime+endTime fingerprint
    const existingKeys = new Set(
      itineraries.map((it: Itinerary) => `${it.startTime}-${it.endTime}`)
    );
    const unique = newItineraries.filter(
      (it: Itinerary) => !existingKeys.has(`${it.startTime}-${it.endTime}`)
    );

    if (unique.length === 0) return;

    // Merge and sort by startTime
    const merged = [...itineraries, ...unique].sort((a, b) => a.startTime - b.startTime);

    // Cap at 20 itineraries
    const capped = merged.slice(0, 20);

    setRoutingResult({
      ...routingResult,
      plan: { ...routingResult.plan!, itineraries: capped },
    });

    // Adjust selected index if we prepended
    if (direction === "earlier") {
      const offset = capped.length - itineraries.length;
      setSelectedItineraryIndex((prev) => Math.min(prev + offset, capped.length - 1));
    }
  }, [routingResult, startLocation, destinationLocation, routingOptions, selectedEnvironments, customEnvironments]);

  const handleSmClear = useCallback(() => {
    setSmResults({});
  }, []);

  const smIsLoading = smSelectedEnvs.some((id) => smResults[id]?.isLoading);

  // Derive stop monitor API config for the map (first selected env)
  const smMapConfig = useMemo(() => {
    if (smSelectedEnvs.length === 0) return { stopMonitorUrl: "", apiKey: "" };
    return getStopMonitorConfig(smSelectedEnvs[0], customEnvironments);
  }, [smSelectedEnvs, customEnvironments]);

  // Derive selected stop ID for map highlighting
  const smSelectedStopId = smStop.type === "stopId" ? smStop.stopId : null;

  // Handle stop marker click on the map → set as monitored stop
  const handleSmStopSelect = useCallback((stop: StopsItem) => {
    setSmStop({
      text: stop.stop_name,
      type: "stopId",
      location: null,
      stopId: stop.stop_id,
      coordinates: { lat: stop.lat, lon: stop.lon },
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-56px)] w-full">
      <ParameterArea>
        {activeTab === "stopmonitor" ? (
          /* FR18: Stop Monitor parameter area */
          <>
            {/* FR18.1: Environment selector (multi-select mode) */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3 mb-3">
              <EnvironmentSelector
                singleSelectMode={false}
                selectedEnvironments={smSelectedEnvs}
                onSelectionChange={setSmSelectedEnvs}
                customEnvironments={customEnvironments}
                onAddCustomEnvironment={handleAddCustomEnvironment}
                onRemoveCustomEnvironment={handleRemoveCustomEnvironment}
                selectedAutocompleteEnv={selectedAutocompleteEnv}
                onAutocompleteEnvChange={setSelectedAutocompleteEnv}
              />
            </div>
            {/* FR18.2–18.7: Stop + DateTime + filters + submit */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs mb-3">
              <StopMonitorForm
                stopLocation={smStop}
                onStopChange={setSmStop}
                dateTime={smDateTime}
                onDateTimeChange={setSmDateTime}
                arrOnly={smArrOnly}
                onArrOnlyChange={setSmArrOnly}
                depOnly={smDepOnly}
                onDepOnlyChange={setSmDepOnly}
                validationErrors={smValidationErrors}
                isLoading={smIsLoading}
                onSubmit={handleStopMonitorSubmit}
                autocompleteEnvId={selectedAutocompleteEnv}
              />
            </div>
          </>
        ) : (
          <>
            {/* Environment Selection - FR3.x */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3 mb-3">
              <EnvironmentSelector
                singleSelectMode={singleSelectMode}
                selectedEnvironments={selectedEnvironments}
                onSelectionChange={handleEnvironmentChange}
                customEnvironments={customEnvironments}
                onAddCustomEnvironment={handleAddCustomEnvironment}
                onRemoveCustomEnvironment={handleRemoveCustomEnvironment}
                selectedAutocompleteEnv={selectedAutocompleteEnv}
                onAutocompleteEnvChange={setSelectedAutocompleteEnv}
              />
            </div>

            {/* Journey Form */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3 mb-3">
          {/* Section label + Copy Link */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{t("routing")}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
              title={t("copyShareableLink")}
            >
              {linkCopied === "success" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span>{t("copied")}</span>
                </>
              ) : linkCopied === "error" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>{t("failed")}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                    <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                  </svg>
                  <span>{t("copyLink")}</span>
                </>
              )}
            </button>
          </div>

          <JourneyForm
            start={startLocation}
            destination={destinationLocation}
            onStartChange={setStartLocation}
            onDestinationChange={setDestinationLocation}
            dateTime={dateTime}
            onDateTimeChange={setDateTime}
            routingOptions={routingOptions}
            onRoutingOptionsChange={setRoutingOptions}
            validationErrors={validationErrors}
            isLoading={isLoading}
            onSubmit={activeTab === "routing-comparison" ? handleComparisonSubmit : handleSubmitRouting}
            routingError={routingError}
            requestHistory={requestHistory}
            onLoadRequest={handleLoadRequest}
            onClearHistory={handleClearHistory}
            autocompleteEnvId={selectedAutocompleteEnv}
          />
          </div>
          </>
        )}
      </ParameterArea>
      <EvaluationArea
        activeTab={activeTab}
        onTabChange={setActiveTab}
        startLocation={startLocation}
        destinationLocation={destinationLocation}
        onStartChange={setStartLocation}
        onDestinationChange={setDestinationLocation}
        routingResult={routingResult}
        selectedItineraryIndex={selectedItineraryIndex}
        onSelectItinerary={handleSelectItinerary}
        onLoadMore={handleLoadMore}
        onClearResults={handleClearResults}
        hoveredLegIndex={hoveredLegIndex}
        onHoverLeg={setHoveredLegIndex}
        comparisonResults={comparisonResults}
        selectedEnvironments={selectedEnvironments}
        customEnvironments={customEnvironments}
        comparisonHoveredItinerary={comparisonHoveredItinerary}
        comparisonSelectedItineraries={comparisonSelectedItineraries}
        comparisonMapItineraries={comparisonMapItineraries}
        comparisonHoveredLegIndex={comparisonHoveredLegIndex}
        onComparisonHover={handleComparisonHover}
        onComparisonToggleSelect={handleComparisonToggleSelect}
        onEnterDetailView={handleEnterDetailView}
        onExitDetailView={handleExitDetailView}
        onComparisonHoverLeg={setComparisonHoveredLegIndex}
        isDetailComparisonView={isDetailComparisonView}
        detailHoveredLeg={detailHoveredLeg}
        onDetailHoverLeg={handleDetailHoverLeg}
        smResults={smResults}
        smSelectedEnvs={smSelectedEnvs}
        smStop={smStop}
        smDateTime={smDateTime}
        smArrOnly={smArrOnly}
        smDepOnly={smDepOnly}
        onStopMonitorMore={handleStopMonitorMore}
        smStopMonitorUrl={smMapConfig.stopMonitorUrl}
        smApiKey={smMapConfig.apiKey}
        smSelectedStopId={smSelectedStopId}
        onSmStopSelect={handleSmStopSelect}
        onSmClear={handleSmClear}
      />
    </div>
  );
}
