"use client";

import Tabs, { TabId } from "./Tabs";
import { LocationValue } from "./LocationInput";
import Map from "./map/DynamicMapLoader";
import ErrorBoundary from "./ErrorBoundary";

interface EvaluationAreaProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  startLocation: LocationValue;
  destinationLocation: LocationValue;
  onStartChange: (value: LocationValue) => void;
  onDestinationChange: (value: LocationValue) => void;
  children?: React.ReactNode;
}

export default function EvaluationArea({
  activeTab,
  onTabChange,
  startLocation,
  destinationLocation,
  onStartChange,
  onDestinationChange,
  children,
}: EvaluationAreaProps) {
  return (
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950">
      <Tabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "routing" && (
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
            />
          </ErrorBoundary>
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
