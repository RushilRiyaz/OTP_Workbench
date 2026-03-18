"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { TimingMode, TravelModeId, OptionalParams, RoutingOptions } from "@/lib/types";
import { TRAVEL_MODES, OPTIONAL_PARAM_IDS } from "@/lib/types";

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
    <div
      className={`rounded-xl border transition-colors ${isOpen ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lvb-yellow rounded-xl"
      >
        {/* Icon */}
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${isOpen ? "bg-lvb-yellow/15 text-lvb-yellow-dark dark:text-lvb-yellow" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}
        >
          {icon}
        </span>

        {/* Label + Badge */}
        <span className="flex-1 flex items-center gap-2 min-w-0">
          <span
            className={`text-sm font-medium transition-colors ${isOpen ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}
          >
            {label}
          </span>
          {badge && (
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors ${isOpen ? "bg-lvb-yellow/20 text-lvb-yellow-dark dark:text-lvb-yellow" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}
            >
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
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
  const t = useTranslations("RoutingOptionsForm");
  const tModes = useTranslations("TravelModes");
  const tParams = useTranslations("OptionalParams");

  const activeOptionsCount = Object.values(value.optionalParams).filter(
    Boolean,
  ).length;
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
  const handleCustomParamsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChange({ ...value, customParams: e.target.value });
  };

  // Get description for a travel mode (returns undefined if no desc key exists)
  const getModeDescription = (modeId: string): string | undefined => {
    const descKey = `${modeId}_desc`;
    // Use next-intl's has() to check if the key exists before translating
    if (!tModes.has(descKey)) return undefined;
    return tModes(descKey);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* FR5.1: Depart At / Arrive By Toggle — iOS-style segmented control */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
          {t("timing")}
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
            {t("departAt")}
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
            {t("arriveBy")}
          </button>
        </div>
      </div>

      {/* FR5.2: Travel Mode Selection (collapsible) */}
      <DisclosurePanel
        label={t("travelModes")}
        icon={
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        }
        badge={t("selected", { count: value.travelModes.length })}
        isOpen={travelModesOpen}
        onToggle={() => setTravelModesOpen(!travelModesOpen)}
      >
        <div
          className={`flex flex-wrap gap-1.5 ${error ? "p-2 rounded-lg border border-red-500" : ""}`}
        >
          {TRAVEL_MODES.map((mode) => {
            const isSelected = value.travelModes.includes(mode.id);
            const description = getModeDescription(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleTravelModeToggle(mode.id)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                  isSelected
                    ? `border-lvb-yellow bg-lvb-yellow-light dark:bg-lvb-yellow/10 text-lvb-yellow-dark dark:text-lvb-yellow shadow-[0_0_0_1px_rgb(251,193,15,0.15)] ${
                        isLastSelectedMode(mode.id)
                          ? "cursor-not-allowed opacity-75"
                          : ""
                      }`
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
                title={
                  isLastSelectedMode(mode.id)
                    ? t("lastModeWarning")
                    : description
                }
              >
                {tModes(mode.id)}
              </button>
            );
          })}
        </div>
        {/* FR6: Validation error message */}
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </DisclosurePanel>

      {/* FR5.5: Optional Parameters (collapsible) */}
      <DisclosurePanel
        label={t("options")}
        icon={
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
        }
        badge={
          activeOptionsCount > 0 ? t("active", { count: activeOptionsCount }) : undefined
        }
        isOpen={optionsOpen}
        onToggle={() => setOptionsOpen(!optionsOpen)}
      >
        <div className="flex flex-col gap-0.5">
          {OPTIONAL_PARAM_IDS.map((paramId) => {
            const isChecked = value.optionalParams[paramId];
            return (
              <label
                key={paramId}
                className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {/* Custom checkbox */}
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleOptionalParamToggle(paramId)}
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
                      <svg
                        className="w-2.5 h-2.5 text-lvb-dark"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className={`text-sm transition-colors ${isChecked ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-600 dark:text-zinc-400"}`}
                >
                  {tParams(paramId)}
                </span>
              </label>
            );
          })}
        </div>
      </DisclosurePanel>

      {/* FR5.6: Custom Parameters (collapsible) */}
      <DisclosurePanel
        label={t("customParameters")}
        icon={
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
            />
          </svg>
        }
        badge={value.customParams.trim() ? t("set") : undefined}
        isOpen={customParamsOpen}
        onToggle={() => setCustomParamsOpen(!customParamsOpen)}
      >
        <textarea
          value={value.customParams}
          onChange={handleCustomParamsChange}
          placeholder={t("customPlaceholder")}
          rows={3}
          className="w-full px-3 py-2 font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:border-transparent transition-colors resize-none"
        />
        <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          {t("customHelp")}
        </p>
      </DisclosurePanel>
    </div>
  );
}

