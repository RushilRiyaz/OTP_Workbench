"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import ParameterArea from "@/components/layout/ParameterArea";
import EvaluationArea from "@/components/layout/EvaluationArea";
import JourneyForm from "@/components/routing/JourneyForm";
import EnvironmentSelector from "@/components/shared/EnvironmentSelector";
import { TabId } from "@/components/layout/Tabs";
import type { RequestHistoryEntry } from "@/lib/types";
import { getEnvironmentConfig } from "@/lib/types";
import StopMonitorForm from "@/components/stop-monitor/StopMonitorForm";
import NearbySearchForm from "@/components/nearby-search/NearbySearchForm";
import { useEnvironment } from "@/lib/hooks/useEnvironment";
import { useRouting } from "@/lib/hooks/useRouting";
import { useComparison } from "@/lib/hooks/useComparison";
import { useStopMonitor } from "@/lib/hooks/useStopMonitor";
import { useNearbySearch } from "@/lib/hooks/useNearbySearch";
import { useUrlStateSync } from "@/lib/hooks/useUrlStateSync";

export default function Home() {
  const t = useTranslations("JourneyForm");

  // Shared state: active tab
  const [activeTab, setActiveTab] = useState<TabId>("routing");

  // --- Domain hooks ---

  const env = useEnvironment();

  const routing = useRouting({
    getEnvConfig: () => {
      const envId = env.selectedEnvironments[0] || "prod";
      const config = getEnvironmentConfig(envId, env.customEnvironments);
      return { envId, otpUrl: config.otpUrl, apiKey: config.apiKey };
    },
    selectedAutocompleteEnv: env.selectedAutocompleteEnv,
  });

  const comparison = useComparison({
    selectedEnvironments: env.selectedEnvironments,
    customEnvironments: env.customEnvironments,
    routingFormState: {
      startLocation: routing.startLocation,
      destinationLocation: routing.destinationLocation,
      dateTime: routing.dateTime,
      routingOptions: routing.routingOptions,
    },
  });

  const stopMonitor = useStopMonitor({
    customEnvironments: env.customEnvironments,
  });

  const nearbySearch = useNearbySearch({
    getApiKey: () =>
      getEnvironmentConfig(env.selectedEnvironments[0] || "prod", env.customEnvironments).apiKey,
  });

  const { linkCopied, handleCopyLink } = useUrlStateSync({
    routingState: {
      startLocation: routing.startLocation,
      destinationLocation: routing.destinationLocation,
      dateTime: routing.dateTime,
      routingOptions: routing.routingOptions,
    },
    envState: {
      selectedEnvironments: env.selectedEnvironments,
      selectedAutocompleteEnv: env.selectedAutocompleteEnv,
      customEnvironments: env.customEnvironments,
    },
    setters: {
      setStartLocation: routing.setStartLocation,
      setDestinationLocation: routing.setDestinationLocation,
      setDateTime: routing.setDateTime,
      setRoutingOptions: routing.setRoutingOptions,
      setSelectedEnvironments: env.setSelectedEnvironments,
      setSelectedAutocompleteEnv: env.setSelectedAutocompleteEnv,
      setCustomEnvironments: env.setCustomEnvironments,
    },
  });

  // --- Cross-domain logic ---

  // FR3.5: Single environment only when Routing or NearbySearch tab
  const singleSelectMode = activeTab === "routing" || activeTab === "nearby-search";
  useEffect(() => {
    if (singleSelectMode) {
      env.setSelectedEnvironments((prev: string[]) => (prev.length > 1 ? [prev[0]] : prev));
    }
  }, [singleSelectMode]);

  // Clear all results (routing + comparison)
  const handleClearResults = useCallback(() => {
    routing.clearRoutingState();
    comparison.clearComparisonState();
  }, [routing.clearRoutingState, comparison.clearComparisonState]);

  // Load historical request — sets routing form + env state
  const handleLoadRequest = (entry: RequestHistoryEntry) => {
    routing.setFormFromHistory(entry);
    if (activeTab !== "routing-comparison") {
      env.setSelectedEnvironments([entry.selectedEnvironment]);
    }
    env.setSelectedAutocompleteEnv(entry.selectedAutocompleteEnv || entry.selectedEnvironment);
  };

  // Pick the right loading/errors/submit based on active tab
  const isComparisonTab = activeTab === "routing-comparison";
  const formIsLoading = isComparisonTab ? comparison.isLoading : routing.isLoading;
  const formValidationErrors = isComparisonTab ? comparison.validationErrors : routing.validationErrors;
  const formOnSubmit = isComparisonTab ? comparison.handleComparisonSubmit : routing.handleSubmitRouting;

  return (
    <div className="flex h-[calc(100vh-56px)] w-full">
      <ParameterArea>
        {activeTab === "stopmonitor" ? (
          /* FR18: Stop Monitor parameter area */
          <>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3 mb-3">
              <EnvironmentSelector
                singleSelectMode={false}
                selectedEnvironments={stopMonitor.smSelectedEnvs}
                onSelectionChange={stopMonitor.setSmSelectedEnvs}
                customEnvironments={env.customEnvironments}
                onAddCustomEnvironment={env.handleAddCustomEnvironment}
                onRemoveCustomEnvironment={env.handleRemoveCustomEnvironment}
                selectedAutocompleteEnv={env.selectedAutocompleteEnv}
                onAutocompleteEnvChange={env.setSelectedAutocompleteEnv}
              />
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs mb-3">
              <StopMonitorForm
                stopLocation={stopMonitor.smStop}
                onStopChange={stopMonitor.setSmStop}
                dateTime={stopMonitor.smDateTime}
                onDateTimeChange={stopMonitor.setSmDateTime}
                arrOnly={stopMonitor.smArrOnly}
                onArrOnlyChange={stopMonitor.setSmArrOnly}
                depOnly={stopMonitor.smDepOnly}
                onDepOnlyChange={stopMonitor.setSmDepOnly}
                validationErrors={stopMonitor.smValidationErrors}
                isLoading={stopMonitor.smIsLoading}
                onSubmit={stopMonitor.handleStopMonitorSubmit}
                autocompleteEnvId={env.selectedAutocompleteEnv}
              />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3 mb-3">
              <EnvironmentSelector
                singleSelectMode={singleSelectMode}
                selectedEnvironments={env.selectedEnvironments}
                onSelectionChange={env.handleEnvironmentChange}
                customEnvironments={env.customEnvironments}
                onAddCustomEnvironment={env.handleAddCustomEnvironment}
                onRemoveCustomEnvironment={env.handleRemoveCustomEnvironment}
                selectedAutocompleteEnv={env.selectedAutocompleteEnv}
                onAutocompleteEnvChange={env.setSelectedAutocompleteEnv}
              />
            </div>

            {/* Journey Form — shown on routing tabs */}
            {(activeTab === "routing" || activeTab === "routing-comparison") && (
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
            start={routing.startLocation}
            destination={routing.destinationLocation}
            onStartChange={routing.setStartLocation}
            onDestinationChange={routing.setDestinationLocation}
            dateTime={routing.dateTime}
            onDateTimeChange={routing.setDateTime}
            routingOptions={routing.routingOptions}
            onRoutingOptionsChange={routing.setRoutingOptions}
            validationErrors={formValidationErrors}
            isLoading={formIsLoading}
            onSubmit={formOnSubmit}
            routingError={routing.routingError}
            requestHistory={routing.requestHistory}
            onLoadRequest={handleLoadRequest}
            onClearHistory={routing.handleClearHistory}
            autocompleteEnvId={env.selectedAutocompleteEnv}
          />
            </div>
            )}

            {/* FR22: NearbySearch Form — shown on nearby-search tab */}
            {activeTab === "nearby-search" && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3 mb-3">
                <NearbySearchForm
                  formState={nearbySearch.nearbySearchFormState}
                  onFormStateChange={nearbySearch.setNearbySearchFormState}
                  isLoading={nearbySearch.nearbySearchLoading}
                  onSubmit={nearbySearch.handleNearbySearchSubmit}
                  error={nearbySearch.nearbySearchError}
                />
              </div>
            )}
          </>
        )}
      </ParameterArea>
      <EvaluationArea
        activeTab={activeTab}
        onTabChange={setActiveTab}
        startLocation={routing.startLocation}
        destinationLocation={routing.destinationLocation}
        onStartChange={routing.setStartLocation}
        onDestinationChange={routing.setDestinationLocation}
        routingResult={routing.routingResult}
        selectedItineraryIndex={routing.selectedItineraryIndex}
        onSelectItinerary={routing.handleSelectItinerary}
        onLoadMore={routing.handleLoadMore}
        onClearResults={handleClearResults}
        hoveredLegIndex={routing.hoveredLegIndex}
        onHoverLeg={routing.setHoveredLegIndex}
        comparisonResults={comparison.comparisonResults}
        selectedEnvironments={env.selectedEnvironments}
        customEnvironments={env.customEnvironments}
        comparisonHoveredItinerary={comparison.comparisonHoveredItinerary}
        comparisonSelectedItineraries={comparison.comparisonSelectedItineraries}
        comparisonMapItineraries={comparison.comparisonMapItineraries}
        comparisonHoveredLegIndex={comparison.comparisonHoveredLegIndex}
        onComparisonHover={comparison.handleComparisonHover}
        onComparisonToggleSelect={comparison.handleComparisonToggleSelect}
        onEnterDetailView={comparison.handleEnterDetailView}
        onExitDetailView={comparison.handleExitDetailView}
        onComparisonHoverLeg={comparison.setComparisonHoveredLegIndex}
        isDetailComparisonView={comparison.isDetailComparisonView}
        detailHoveredLeg={comparison.detailHoveredLeg}
        onDetailHoverLeg={comparison.handleDetailHoverLeg}
        smResults={stopMonitor.smResults}
        smSelectedEnvs={stopMonitor.smSelectedEnvs}
        smStop={stopMonitor.smStop}
        smDateTime={stopMonitor.smDateTime}
        smArrOnly={stopMonitor.smArrOnly}
        smDepOnly={stopMonitor.smDepOnly}
        onStopMonitorMore={stopMonitor.handleStopMonitorMore}
        smStopMonitorUrl={stopMonitor.smMapConfig.stopMonitorUrl}
        smApiKey={stopMonitor.smMapConfig.apiKey}
        smSelectedStopId={stopMonitor.smSelectedStopId}
        onSmStopSelect={stopMonitor.handleSmStopSelect}
        onSmClear={stopMonitor.handleSmClear}
        nearbySearchCenter={nearbySearch.nearbySearchFormState.center}
        nearbySearchRadius={nearbySearch.nearbySearchFormState.radius}
        nearbySearchResults={nearbySearch.nearbySearchResults}
        nearbySearchSelectedItem={nearbySearch.nearbySearchSelectedItem}
        onNearbySearchCenterChange={nearbySearch.handleNearbySearchCenterChange}
        onNearbySearchRadiusChange={nearbySearch.handleNearbySearchRadiusChange}
        onNearbySearchSelectItem={nearbySearch.setNearbySearchSelectedItem}
      />
    </div>
  );
}
