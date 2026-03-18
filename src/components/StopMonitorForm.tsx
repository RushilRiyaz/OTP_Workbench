"use client";

// FR18: Stop Monitor parameter area form

import { useTranslations } from "next-intl";
import LocationInput from "@/components/LocationInput";
import DateTimeInput from "@/components/DateTimeInput";
import type { LocationValue, ValidationError } from "@/lib/types";

interface StopMonitorFormProps {
  stopLocation: LocationValue;
  onStopChange: (value: LocationValue) => void;
  dateTime: string;
  onDateTimeChange: (value: string) => void;
  /** FR18.4: Arrivals only checkbox */
  arrOnly: boolean;
  onArrOnlyChange: (value: boolean) => void;
  /** FR18.5: Departures only checkbox */
  depOnly: boolean;
  onDepOnlyChange: (value: boolean) => void;
  validationErrors: ValidationError[];
  isLoading: boolean;
  onSubmit: () => void;
  /** Environment ID used for autocomplete location search */
  autocompleteEnvId: string;
}

export default function StopMonitorForm({
  stopLocation,
  onStopChange,
  dateTime,
  onDateTimeChange,
  arrOnly,
  onArrOnlyChange,
  depOnly,
  onDepOnlyChange,
  validationErrors,
  isLoading,
  onSubmit,
  autocompleteEnvId,
}: StopMonitorFormProps) {
  const t = useTranslations("StopMonitor");
  const tVal = useTranslations("Validation");

  const stopError = validationErrors.find((e) => e.field === "stop");
  const dateTimeError = validationErrors.find((e) => e.field === "dateTime");

  // FR18.6: Mutually exclusive checkboxes
  function handleArrOnly(checked: boolean) {
    onArrOnlyChange(checked);
    if (checked) onDepOnlyChange(false);
  }

  function handleDepOnly(checked: boolean) {
    onDepOnlyChange(checked);
    if (checked) onArrOnlyChange(false);
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* FR18.2: Stop name input — filtered to transit stops only */}
      <LocationInput
        label={t("stop")}
        value={stopLocation}
        onChange={onStopChange}
        placeholder={t("stopPlaceholder")}
        required
        error={stopError ? tVal(stopError.message as Parameters<typeof tVal>[0]) : undefined}
        autocompleteEnvId={autocompleteEnvId}
        pointType="S"
      />

      {/* FR18.3: Date and time */}
      <DateTimeInput
        label="Date & Time"
        value={dateTime}
        onChange={onDateTimeChange}
        required
        error={dateTimeError ? tVal(dateTimeError.message as Parameters<typeof tVal>[0]) : undefined}
      />

      {/* FR18.4–18.6: Arrivals / Departures only checkboxes */}
      <div className="flex flex-col gap-0.5">
        {(
          [
            { checked: arrOnly, onChange: handleArrOnly, label: t("arrOnly") },
            { checked: depOnly, onChange: handleDepOnly, label: t("depOnly") },
          ] as const
        ).map(({ checked, onChange, label }, idx) => (
          <label
            key={idx}
            className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors select-none"
          >
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  checked
                    ? "bg-lvb-yellow border-lvb-yellow"
                    : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                }`}
              >
                {checked && (
                  <svg
                    className="w-2.5 h-2.5 text-lvb-dark"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span
              className={`text-sm transition-colors ${
                checked
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* FR18.7: Submit button */}
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-lvb-yellow hover:bg-lvb-yellow-hover disabled:opacity-60 disabled:cursor-not-allowed text-lvb-dark font-semibold rounded-xl transition-all duration-200 focus:ring-2 focus:ring-lvb-yellow focus:outline-none text-sm shadow-[0_2px_8px_0_rgb(251,193,15,0.35)] hover:shadow-[0_4px_12px_0_rgb(251,193,15,0.45)] disabled:shadow-none"
      >
        {isLoading ? t("requesting") : t("submit")}
      </button>
    </div>
  );
}
