"use client";

import { useState, useEffect } from "react";
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
