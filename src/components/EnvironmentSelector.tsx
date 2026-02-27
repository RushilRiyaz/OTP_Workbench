"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Predefined OTP environments — populated from .env
const PREDEFINED_ENVIRONMENTS = [
  {
    id: "prod" as const,
    label: "PROD",
    otpUrl: process.env.NEXT_PUBLIC_PROD_OTP_URL || "",
    autocompleteUrl: process.env.NEXT_PUBLIC_PROD_AUTOCOMPLETE_URL || "",
    apiKey: process.env.NEXT_PUBLIC_PROD_API_KEY || "",
  },
  {
    id: "stage" as const,
    label: "STAGE",
    otpUrl: process.env.NEXT_PUBLIC_STAGE_OTP_URL || "",
    autocompleteUrl: process.env.NEXT_PUBLIC_STAGE_AUTOCOMPLETE_URL || "",
    apiKey: process.env.NEXT_PUBLIC_STAGE_API_KEY || "",
  },
  {
    id: "dev" as const,
    label: "DEV",
    otpUrl: process.env.NEXT_PUBLIC_DEV_OTP_URL || "",
    autocompleteUrl: process.env.NEXT_PUBLIC_DEV_AUTOCOMPLETE_URL || "",
    apiKey: process.env.NEXT_PUBLIC_DEV_API_KEY || "",
  },
];

// Predefined autocomplete environments — populated from .env
export const AUTOCOMPLETE_ENVIRONMENTS = [
  { id: "prod" as const, label: "PROD", url: process.env.NEXT_PUBLIC_PROD_AUTOCOMPLETE_URL || "", apiKey: process.env.NEXT_PUBLIC_PROD_API_KEY || "" },
  { id: "stage" as const, label: "STAGE", url: process.env.NEXT_PUBLIC_STAGE_AUTOCOMPLETE_URL || "", apiKey: process.env.NEXT_PUBLIC_STAGE_API_KEY || "" },
  { id: "dev" as const, label: "DEV", url: process.env.NEXT_PUBLIC_DEV_AUTOCOMPLETE_URL || "", apiKey: process.env.NEXT_PUBLIC_DEV_API_KEY || "" },
];

export type PredefinedEnvId = "prod" | "stage" | "dev";

/** Resolve OTP + autocomplete config for a given environment ID */
export function getEnvironmentConfig(
  envId: string,
  customEnvironments: Environment[] = []
): { otpUrl: string; autocompleteUrl: string; apiKey: string } {
  const predefined = PREDEFINED_ENVIRONMENTS.find((e) => e.id === envId);
  if (predefined) {
    return { otpUrl: predefined.otpUrl, autocompleteUrl: predefined.autocompleteUrl, apiKey: predefined.apiKey };
  }
  const custom = customEnvironments.find((e) => e.id === envId);
  if (custom) {
    return { otpUrl: custom.otpUrl, autocompleteUrl: custom.autocompleteUrl, apiKey: custom.apiKey };
  }
  // Fallback to first predefined (PROD)
  return {
    otpUrl: PREDEFINED_ENVIRONMENTS[0].otpUrl,
    autocompleteUrl: PREDEFINED_ENVIRONMENTS[0].autocompleteUrl,
    apiKey: PREDEFINED_ENVIRONMENTS[0].apiKey,
  };
}

/** Resolve autocomplete config for a given autocomplete environment ID */
export function getAutocompleteConfig(envId: string): { url: string; apiKey: string } {
  const acEnv = AUTOCOMPLETE_ENVIRONMENTS.find((e) => e.id === envId);
  if (acEnv) return { url: acEnv.url, apiKey: acEnv.apiKey };
  return { url: AUTOCOMPLETE_ENVIRONMENTS[0].url, apiKey: AUTOCOMPLETE_ENVIRONMENTS[0].apiKey };
}

export interface Environment {
  id: string;
  label: string;
  otpUrl: string;
  autocompleteUrl: string;
  apiKey: string;
  isCustom: boolean;
}

interface EnvironmentSelectorProps {
  /** When true, only single selection is allowed (Routing use case) */
  singleSelectMode: boolean;
  /** Currently selected environment IDs */
  selectedEnvironments: string[];
  /** Callback when selection changes */
  onSelectionChange: (selectedIds: string[]) => void;
  /** Custom environments added by user */
  customEnvironments: Environment[];
  /** Callback to add a custom environment */
  onAddCustomEnvironment: (env: Environment) => void;
  /** Callback to remove a custom environment */
  onRemoveCustomEnvironment: (envId: string) => void;
  /** Currently selected autocomplete environment ID */
  selectedAutocompleteEnv: string;
  /** Callback when autocomplete environment changes */
  onAutocompleteEnvChange: (id: string) => void;
}

export default function EnvironmentSelector({
  singleSelectMode,
  selectedEnvironments,
  onSelectionChange,
  customEnvironments,
  onAddCustomEnvironment,
  onRemoveCustomEnvironment,
  selectedAutocompleteEnv,
  onAutocompleteEnvChange,
}: EnvironmentSelectorProps) {
  const [customName, setCustomName] = useState("");
  const [customOtpUrl, setCustomOtpUrl] = useState("");
  const [customAutocompleteUrl, setCustomAutocompleteUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const t = useTranslations("EnvironmentSelector");

  // Combine predefined and custom environments
  const allEnvironments: Environment[] = [
    ...PREDEFINED_ENVIRONMENTS.map((env) => ({
      ...env,
      isCustom: false,
    })),
    ...customEnvironments,
  ];

  // Resolve selected environment labels
  const selectedEnvObjects = selectedEnvironments
    .map((id) => allEnvironments.find((e) => e.id === id))
    .filter(Boolean) as Environment[];

  const handleEnvironmentToggle = (envId: string) => {
    if (singleSelectMode) {
      onSelectionChange([envId]);
    } else {
      if (selectedEnvironments.includes(envId)) {
        onSelectionChange(selectedEnvironments.filter((id) => id !== envId));
      } else {
        if (selectedEnvironments.length < 3) {
          onSelectionChange([...selectedEnvironments, envId]);
        }
      }
    }
  };

  const handleAddCustomEnvironment = () => {
    if (!customName.trim() || !customOtpUrl.trim()) return;

    const newEnv: Environment = {
      id: `custom-${Date.now()}`,
      label: customName.trim(),
      otpUrl: customOtpUrl.trim(),
      autocompleteUrl: customAutocompleteUrl.trim(),
      apiKey: "",
      isCustom: true,
    };

    onAddCustomEnvironment(newEnv);
    setCustomName("");
    setCustomOtpUrl("");
    setCustomAutocompleteUrl("");
    setShowAddForm(false);
  };

  const handleRemoveCustom = (envId: string) => {
    if (selectedEnvironments.includes(envId)) {
      onSelectionChange(selectedEnvironments.filter((id) => id !== envId));
    }
    onRemoveCustomEnvironment(envId);
  };

  const isSelected = (envId: string) => selectedEnvironments.includes(envId);
  const isDisabled = (envId: string) =>
    !singleSelectMode &&
    !isSelected(envId) &&
    selectedEnvironments.length >= 3;

  // Resolve autocomplete label for display
  const acLabel = AUTOCOMPLETE_ENVIRONMENTS.find((e) => e.id === selectedAutocompleteEnv)?.label || selectedAutocompleteEnv.toUpperCase();

  // In single-select mode with a selection, show collapsed view by default
  const showCollapsed = singleSelectMode && selectedEnvObjects.length > 0 && !isListOpen;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {singleSelectMode ? t("environment") : t("environments")}
        </label>
        {!singleSelectMode && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("selectedCount", { count: selectedEnvironments.length })}
          </span>
        )}
      </div>

      {showCollapsed ? (
        /* Collapsed view: show active environment + autocomplete badge + change button */
        <button
          type="button"
          onClick={() => setIsListOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-lvb-yellow/50 bg-lvb-yellow/8 dark:bg-lvb-yellow/10 shadow-[0_0_0_1px_rgb(251,193,15,0.15)] transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow group"
        >
          <div className="flex items-center gap-2.5">
            {/* Active indicator dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>

            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedEnvObjects[0].label}
            </span>

            {selectedEnvObjects[0].isCustom && (
              <span className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full">
                {t("custom")}
              </span>
            )}

            {/* Autocomplete environment badge */}
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full border border-zinc-200 dark:border-zinc-700">
              <svg className="w-2.5 h-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {acLabel}
            </span>
          </div>

          <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
            {t("change")}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
      ) : (
        /* Expanded view: full environment list */
        <>
          <div className="space-y-1.5 animate-collapsible-open">
            {allEnvironments.map((env) => (
              <div key={env.id}>
                <button
                  type="button"
                  disabled={isDisabled(env.id)}
                  onClick={() => handleEnvironmentToggle(env.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                    isSelected(env.id)
                      ? "border-lvb-yellow/50 bg-lvb-yellow/8 dark:bg-lvb-yellow/10 shadow-[0_0_0_1px_rgb(251,193,15,0.15)]"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500"
                  } ${isDisabled(env.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    {/* Checkbox/Radio indicator */}
                    <div
                      className={`w-4 h-4 rounded ${singleSelectMode ? "rounded-full" : "rounded"} border-2 flex items-center justify-center ${
                        isSelected(env.id)
                          ? "border-lvb-yellow bg-lvb-yellow"
                          : "border-zinc-400 dark:border-zinc-500"
                      }`}
                    >
                      {isSelected(env.id) && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {singleSelectMode ? (
                            <circle cx="10" cy="10" r="5" />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                      )}
                    </div>

                    <span className={`text-sm ${isSelected(env.id) ? "font-semibold text-zinc-900 dark:text-zinc-100" : "font-medium text-zinc-700 dark:text-zinc-300"}`}>
                      {env.label}
                    </span>

                    {env.isCustom && (
                      <span className="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full border border-zinc-300 dark:border-zinc-600">
                        {t("custom")}
                      </span>
                    )}
                  </div>

                  {/* Remove button for custom environments */}
                  {env.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustom(env.id);
                      }}
                      className="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                      title={t("removeCustom")}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </button>

              </div>
            ))}
          </div>

          {/* Autocomplete service picker — only in single-select (Routing) mode */}
          {singleSelectMode && selectedEnvironments.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {t("autocompleteService")}
              </span>
              <div className="inline-flex p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                {AUTOCOMPLETE_ENVIRONMENTS.map((acEnv) => (
                  <button
                    key={acEnv.id}
                    type="button"
                    onClick={() => onAutocompleteEnvChange(acEnv.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                      selectedAutocompleteEnv === acEnv.id
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    {acEnv.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add custom environment section */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-1 p-2 text-sm text-lvb-yellow-dark dark:text-lvb-yellow border border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl hover:border-lvb-yellow dark:hover:border-lvb-yellow hover:bg-lvb-yellow/8 dark:hover:bg-lvb-yellow/10 transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t("addCustomEnvironment")}
            </button>
          ) : (
            <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 bg-zinc-50 dark:bg-zinc-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
              <input
                type="text"
                placeholder={t("environmentName")}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
              />
              <input
                type="text"
                placeholder={t("otpApiUrl")}
                value={customOtpUrl}
                onChange={(e) => setCustomOtpUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
              />
              <input
                type="text"
                placeholder={t("autocompleteApiUrl")}
                value={customAutocompleteUrl}
                onChange={(e) => setCustomAutocompleteUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCustomEnvironment}
                  disabled={!customName.trim() || !customOtpUrl.trim()}
                  className="flex-1 px-3 py-1.5 text-sm font-semibold text-lvb-dark bg-lvb-yellow rounded-lg hover:bg-lvb-yellow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                >
                  {t("add")}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setCustomName("");
                    setCustomOtpUrl("");
                    setCustomAutocompleteUrl("");
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Confirm button in single-select mode */}
          {singleSelectMode && selectedEnvObjects.length > 0 && (
            <button
              type="button"
              onClick={() => { setIsListOpen(false); setShowAddForm(false); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-lvb-dark bg-lvb-yellow rounded-xl hover:bg-lvb-yellow-hover transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t("confirm")}
            </button>
          )}
        </>
      )}

      {/* Helper text */}
      {singleSelectMode && !showCollapsed && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("singleModeHelp")}
        </p>
      )}
    </div>
  );
}
