"use client";

import { useState } from "react";

// FR5: Time & Routing Options

export type TimingMode = "departAt" | "arriveBy";

// FR5.2: Predefined travel modes (Transit modes from Routing API)
export const TRAVEL_MODES = [
  { id: "TRANSIT", label: "Transit", description: "The same as WALK, TRAM, BUS, SUBURB, TRAIN" },
  { id: "BIKE", label: "Bike", description: null },
  { id: "BIKERENTAL", label: "Bike Rental", description: null },
  { id: "WALK", label: "Walk", description: null },
  { id: "CAR", label: "Car", description: null },
  { id: "CARRENTAL", label: "Car Rental", description: null },
  { id: "BUS", label: "Bus", description: null },
  { id: "TRAM", label: "Tram", description: null },
  { id: "SUBURB", label: "S-Bahn", description: "Suburban railway" },
  { id: "TRAIN", label: "Train", description: "Regional and long distance" },
  { id: "TAXI4884", label: "Taxi4884", description: "CAR routing within TAXI4884 service area" },
  { id: "ESCOOTER", label: "E-Scooter", description: "Max 15 minutes walking legs" },
  { id: "FLEXA", label: "Flexa", description: "On-demand bus in Leipzig" },
  { id: "SUBWAY", label: "U-Bahn", description: null },
  { id: "RRB", label: "RRB", description: "Rail replacement bus (SEV)" },
  { id: "OD", label: "OD", description: "On-demand bus (Rufbus)" },
  { id: "ICE", label: "ICE", description: "Inter-city express" },
  { id: "IC", label: "IC", description: "Inter-city rail" },
  { id: "COACH", label: "Coach", description: "Long distance bus" },
  { id: "RE", label: "RE", description: "Regional express (Regional-Bahn)" },
] as const;

export type TravelModeId = (typeof TRAVEL_MODES)[number]["id"];

// FR5.5: Optional parameters
export interface OptionalParams {
  accessibility: boolean;
  shortWalk: boolean;
  lessTransfers: boolean;
  transitOnly: boolean;
}

export const OPTIONAL_PARAMS = [
  { id: "accessibility", label: "Wheelchair Accessible" },
  { id: "shortWalk", label: "Short Walk" },
  { id: "lessTransfers", label: "Less Transfers" },
  { id: "transitOnly", label: "Transit Only" },
] as const;

export interface RoutingOptions {
  timingMode: TimingMode; // FR5.1
  travelModes: TravelModeId[]; // FR5.2
  optionalParams: OptionalParams; // FR5.5
  customParams: string; // FR5.6
}

// FR5.4: Default values
export const defaultRoutingOptions: RoutingOptions = {
  timingMode: "departAt",
  travelModes: ["TRANSIT"], // FR5.4: TRANSIT preselected by default
  optionalParams: {
    accessibility: false,
    shortWalk: false,
    lessTransfers: false,
    transitOnly: false,
  },
  customParams: "", // FR5.6
};

interface RoutingOptionsFormProps {
  value: RoutingOptions;
  onChange: (value: RoutingOptions) => void;
  error?: string; // FR6: Validation error for travel modes
}

// Collapsible disclosure panel
function DisclosurePanel({
  label,
  icon,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border transition-colors ${isOpen ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lvb-yellow rounded-xl"
      >
        {/* Icon */}
        <span className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${isOpen ? "bg-lvb-yellow/15 text-lvb-yellow-dark dark:text-lvb-yellow" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
          {icon}
        </span>

        {/* Label + Badge */}
        <span className="flex-1 flex items-center gap-2 min-w-0">
          <span className={`text-sm font-medium transition-colors ${isOpen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
            {label}
          </span>
          {badge && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors ${isOpen ? "bg-lvb-yellow/20 text-lvb-yellow-dark dark:text-lvb-yellow" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
              {badge}
            </span>
          )}
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-3 pb-3 pt-0 animate-collapsible-open">
          <div className="border-t border-zinc-200/80 dark:border-zinc-700/60 pt-2.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoutingOptionsForm({
  value,
  onChange,
  error,
}: RoutingOptionsFormProps) {
  const [travelModesOpen, setTravelModesOpen] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [customParamsOpen, setCustomParamsOpen] = useState(false);

  const activeOptionsCount = Object.values(value.optionalParams).filter(Boolean).length;
  // FR5.1: Handle timing mode change
  const handleTimingModeChange = (mode: TimingMode) => {
    onChange({ ...value, timingMode: mode });
  };

  // FR5.2: Handle travel mode toggle
  const handleTravelModeToggle = (modeId: TravelModeId) => {
    const isSelected = value.travelModes.includes(modeId);

    if (isSelected) {
      // FR5.3: Enforce at least one travel mode selected
      if (value.travelModes.length <= 1) {
        return; // Don't allow deselecting the last mode
      }
      // Remove mode
      const newModes = value.travelModes.filter((m) => m !== modeId);
      onChange({ ...value, travelModes: newModes });
    } else {
      // Add mode
      onChange({ ...value, travelModes: [...value.travelModes, modeId] });
    }
  };

  // FR5.3: Check if mode is the last one selected (for disabled styling)
  const isLastSelectedMode = (modeId: TravelModeId) => {
    return value.travelModes.length === 1 && value.travelModes.includes(modeId);
  };

  // FR5.5: Handle optional param toggle
  const handleOptionalParamToggle = (paramId: keyof OptionalParams) => {
    onChange({
      ...value,
      optionalParams: {
        ...value.optionalParams,
        [paramId]: !value.optionalParams[paramId],
      },
    });
  };

  // FR5.6: Handle custom params change
  const handleCustomParamsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, customParams: e.target.value });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* FR5.1: Depart At / Arrive By Toggle — iOS-style segmented control */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
          Timing
        </label>
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => handleTimingModeChange("departAt")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              value.timingMode === "departAt"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Depart At
          </button>
          <button
            type="button"
            onClick={() => handleTimingModeChange("arriveBy")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              value.timingMode === "arriveBy"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Arrive By
          </button>
        </div>
      </div>

      {/* FR5.2: Travel Mode Selection (collapsible) */}
      <DisclosurePanel
        label="Travel Modes"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        }
        badge={`${value.travelModes.length} selected`}
        isOpen={travelModesOpen}
        onToggle={() => setTravelModesOpen(!travelModesOpen)}
      >
        <div className={`flex flex-wrap gap-1.5 ${error ? "p-2 rounded-lg border border-red-500" : ""}`}>
          {TRAVEL_MODES.map((mode) => {
            const isSelected = value.travelModes.includes(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleTravelModeToggle(mode.id)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  isSelected
                    ? `border-lvb-yellow bg-lvb-yellow-light dark:bg-lvb-yellow/10 text-lvb-yellow-dark dark:text-lvb-yellow shadow-[0_0_0_1px_rgb(251,193,15,0.15)] ${
                        isLastSelectedMode(mode.id) ? "cursor-not-allowed opacity-75" : ""
                      }`
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
                title={isLastSelectedMode(mode.id) ? "At least one travel mode must be selected" : mode.description ?? undefined}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
        {/* FR6: Validation error message */}
        {error && (
          <p className="text-xs text-red-500 mt-1.5">{error}</p>
        )}
      </DisclosurePanel>

      {/* FR5.5: Optional Parameters (collapsible) */}
      <DisclosurePanel
        label="Options"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        }
        badge={activeOptionsCount > 0 ? `${activeOptionsCount} active` : undefined}
        isOpen={optionsOpen}
        onToggle={() => setOptionsOpen(!optionsOpen)}
      >
        <div className="flex flex-col gap-0.5">
          {OPTIONAL_PARAMS.map((param) => {
            const isChecked = value.optionalParams[param.id];
            return (
              <label
                key={param.id}
                className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {/* Custom checkbox */}
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleOptionalParamToggle(param.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      isChecked
                        ? "bg-lvb-yellow border-lvb-yellow"
                        : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-2.5 h-2.5 text-lvb-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`text-sm transition-colors ${isChecked ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {param.label}
                </span>
              </label>
            );
          })}
        </div>
      </DisclosurePanel>

      {/* FR5.6: Custom Parameters (collapsible) */}
      <DisclosurePanel
        label="Custom Parameters"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        }
        badge={value.customParams.trim() ? "set" : undefined}
        isOpen={customParamsOpen}
        onToggle={() => setCustomParamsOpen(!customParamsOpen)}
      >
        <textarea
          value={value.customParams}
          onChange={handleCustomParamsChange}
          placeholder="e.g. numItineraries=3&maxWalkDistance=1000"
          rows={3}
          className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:border-transparent transition-colors resize-none"
        />
        <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          Add extra query parameters (key=value format)
        </p>
      </DisclosurePanel>
    </div>
  );
}
