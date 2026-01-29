"use client";

import { useState } from "react";

// Predefined environments
const PREDEFINED_ENVIRONMENTS = [
  { id: "prod", label: "PROD", url: "" },
  { id: "stage", label: "STAGE", url: "" },
  { id: "dev", label: "DEV", url: "" },
] as const;

export type PredefinedEnvId = (typeof PREDEFINED_ENVIRONMENTS)[number]["id"];

export interface Environment {
  id: string;
  label: string;
  url: string;
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
}

export default function EnvironmentSelector({
  singleSelectMode,
  selectedEnvironments,
  onSelectionChange,
  customEnvironments,
  onAddCustomEnvironment,
  onRemoveCustomEnvironment,
}: EnvironmentSelectorProps) {
  const [customName, setCustomName] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Combine predefined and custom environments
  const allEnvironments: Environment[] = [
    ...PREDEFINED_ENVIRONMENTS.map((env) => ({
      ...env,
      isCustom: false,
    })),
    ...customEnvironments,
  ];

  const handleEnvironmentToggle = (envId: string) => {
    if (singleSelectMode) {
      // Single select mode: replace selection
      onSelectionChange([envId]);
    } else {
      // Multi-select mode: toggle selection (max 3)
      if (selectedEnvironments.includes(envId)) {
        // Remove from selection
        onSelectionChange(selectedEnvironments.filter((id) => id !== envId));
      } else {
        // Add to selection (if under limit)
        if (selectedEnvironments.length < 3) {
          onSelectionChange([...selectedEnvironments, envId]);
        }
      }
    }
  };

  const handleAddCustomEnvironment = () => {
    if (!customName.trim() || !customUrl.trim()) return;

    const newEnv: Environment = {
      id: `custom-${Date.now()}`,
      label: customName.trim(),
      url: customUrl.trim(),
      isCustom: true,
    };

    onAddCustomEnvironment(newEnv);
    setCustomName("");
    setCustomUrl("");
    setShowAddForm(false);
  };

  const handleRemoveCustom = (envId: string) => {
    // Also remove from selection if selected
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Environment{!singleSelectMode && "s"}
        </label>
        {!singleSelectMode && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedEnvironments.length}/3 selected
          </span>
        )}
      </div>

      {/* Environment list */}
      <div className="space-y-2">
        {allEnvironments.map((env) => (
          <div
            key={env.id}
            className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
              isSelected(env.id)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500"
            } ${isDisabled(env.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => !isDisabled(env.id) && handleEnvironmentToggle(env.id)}
          >
            <div className="flex items-center gap-2">
              {/* Checkbox/Radio indicator */}
              <div
                className={`w-4 h-4 rounded ${singleSelectMode ? "rounded-full" : "rounded"} border-2 flex items-center justify-center ${
                  isSelected(env.id)
                    ? "border-blue-500 bg-blue-500"
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

              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {env.label}
              </span>

              {env.isCustom && (
                <span className="text-xs px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                  Custom
                </span>
              )}
            </div>

            {/* Remove button for custom environments */}
            {env.isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCustom(env.id);
                }}
                className="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Remove custom environment"
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
          </div>
        ))}
      </div>

      {/* Add custom environment section */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-1 p-2 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-md hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
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
          Add Custom Environment
        </button>
      ) : (
        <div className="p-3 border border-zinc-300 dark:border-zinc-600 rounded-md space-y-2 bg-zinc-50 dark:bg-zinc-800">
          <input
            type="text"
            placeholder="Environment name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="API URL"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCustomEnvironment}
              disabled={!customName.trim() || !customUrl.trim()}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setCustomName("");
                setCustomUrl("");
              }}
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Helper text */}
      {singleSelectMode && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Single environment mode. Switch to &quot;Routing Comparison&quot; to compare multiple environments.
        </p>
      )}
    </div>
  );
}
