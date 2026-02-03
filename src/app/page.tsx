"use client";

import { useState, useEffect } from "react";
import ParameterArea from "@/components/ParameterArea";
import EvaluationArea from "@/components/EvaluationArea";
import JourneyForm from "@/components/JourneyForm";
import EnvironmentSelector, { Environment } from "@/components/EnvironmentSelector";
import { TabId } from "@/components/Tabs";
import { LocationValue, emptyLocationValue } from "@/components/LocationInput";

export default function Home() {
  // Shared state: active tab
  const [activeTab, setActiveTab] = useState<TabId>("routing");

  // Environment selection state
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(["prod"]); // FR3.6: PROD preselected
  const [customEnvironments, setCustomEnvironments] = useState<Environment[]>([]);

  // Journey state - lifted from JourneyForm for map interaction (FR8)
  const [startLocation, setStartLocation] = useState<LocationValue>(emptyLocationValue);
  const [destinationLocation, setDestinationLocation] = useState<LocationValue>(emptyLocationValue);

  // Determine if single select mode based on active tab
  // FR3.5: Single environment only when Routing use case selected
  const singleSelectMode = activeTab === "routing";

  // FR3.5: When switching to single-select mode, keep only first selection
  useEffect(() => {
    if (singleSelectMode) {
      setSelectedEnvironments((prev) => (prev.length > 1 ? [prev[0]] : prev));
    }
  }, [singleSelectMode]);

  const handleAddCustomEnvironment = (env: Environment) => {
    setCustomEnvironments((prev) => [...prev, env]);
  };

  const handleRemoveCustomEnvironment = (envId: string) => {
    setCustomEnvironments((prev) => prev.filter((e) => e.id !== envId));
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
        />
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
