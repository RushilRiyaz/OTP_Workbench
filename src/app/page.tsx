"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ParameterArea from "@/components/ParameterArea";
import EvaluationArea from "@/components/EvaluationArea";
import JourneyForm from "@/components/JourneyForm";
import EnvironmentSelector, { Environment } from "@/components/EnvironmentSelector";
import { TabId } from "@/components/Tabs";
import { LocationValue, emptyLocationValue } from "@/components/LocationInput";
import { RoutingOptions, defaultRoutingOptions } from "@/components/RoutingOptionsForm";
import { ValidationError, RequestHistoryEntry } from "@/lib/types";
import { validateRoutingParams } from "@/lib/validation";
import { fetchRouting, RoutingResponse, RoutingError } from "@/lib/routing";
import { getRequestHistory, addToRequestHistory, clearRequestHistory, generateDisplayLabel } from "@/lib/requestHistory";
import { serializeFormState, deserializeUrlParams } from "@/lib/urlParams";
import RequestHistoryList from "@/components/RequestHistoryList";

export default function Home() {
  // Shared state: active tab
  const [activeTab, setActiveTab] = useState<TabId>("routing");

  // Environment selection state
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(["prod"]); // FR3.6: PROD preselected
  const [customEnvironments, setCustomEnvironments] = useState<Environment[]>([]);

  // Journey state - lifted from JourneyForm for map interaction (FR8)
  const [startLocation, setStartLocation] = useState<LocationValue>(emptyLocationValue);
  const [destinationLocation, setDestinationLocation] = useState<LocationValue>(emptyLocationValue);

  // FR6: Lifted state from JourneyForm
  const [dateTime, setDateTime] = useState<string>("");
  const [routingOptions, setRoutingOptions] = useState<RoutingOptions>(defaultRoutingOptions);

  // FR6: Request state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [routingResult, setRoutingResult] = useState<RoutingResponse | null>(null);
  const [routingError, setRoutingError] = useState<RoutingError | null>(null);

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
  }, [urlInitialized, startLocation, destinationLocation, dateTime, routingOptions, selectedEnvironments, customEnvironments]);

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
      const result = await fetchRouting({
        start: startLocation,
        destination: destinationLocation,
        dateTime,
        routingOptions,
      });

      if (result.success) {
        setRoutingResult(result.data);

        // FR6.4: Save to request history
        const historyEntry: RequestHistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          start: startLocation,
          destination: destinationLocation,
          dateTime,
          routingOptions,
          selectedEnvironment: selectedEnvironments[0] || "prod",
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

  // FR6.5: Load historical request (overwrites current, no warning)
  const handleLoadRequest = (entry: RequestHistoryEntry) => {
    setStartLocation(entry.start);
    setDestinationLocation(entry.destination);
    setDateTime(entry.dateTime);
    setRoutingOptions(entry.routingOptions);
    setSelectedEnvironments([entry.selectedEnvironment]);
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

  return (
    <div className="flex h-screen w-full">
      <ParameterArea>
        {/* FR6.6: Copy Link Button */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Copy shareable link"
          >
            {linkCopied === "success" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                <span>Copied!</span>
              </>
            ) : linkCopied === "error" ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>Failed</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                  <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Environment Selection - FR3.x */}
        <EnvironmentSelector
          singleSelectMode={singleSelectMode}
          selectedEnvironments={selectedEnvironments}
          onSelectionChange={setSelectedEnvironments}
          customEnvironments={customEnvironments}
          onAddCustomEnvironment={handleAddCustomEnvironment}
          onRemoveCustomEnvironment={handleRemoveCustomEnvironment}
        />

        {/* Divider */}
        <div className="my-4 border-t border-zinc-300 dark:border-zinc-700" />

        {/* Journey Form */}
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
          onSubmit={handleSubmitRouting}
          routingError={routingError}
        />

        {/* FR6.4-6.5: Request History */}
        {requestHistory.length > 0 && (
          <>
            <div className="my-4 border-t border-zinc-300 dark:border-zinc-700" />
            <RequestHistoryList
              history={requestHistory}
              onLoad={handleLoadRequest}
              onClear={handleClearHistory}
            />
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
      />
    </div>
  );
}
