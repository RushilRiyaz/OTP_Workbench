"use client";

// FR18: Stop Monitor parameter area form

import { useTranslations } from "next-intl";
import LocationInput, { LocationValue } from "@/components/LocationInput";
import DateTimeInput from "@/components/DateTimeInput";
import { ValidationError } from "@/lib/types";

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
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={arrOnly}
            onChange={(e) => handleArrOnly(e.target.checked)}
            className="w-4 h-4 rounded accent-lvb-yellow focus:ring-2 focus:ring-lvb-yellow focus:outline-none"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">{t("arrOnly")}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={depOnly}
            onChange={(e) => handleDepOnly(e.target.checked)}
            className="w-4 h-4 rounded accent-lvb-yellow focus:ring-2 focus:ring-lvb-yellow focus:outline-none"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">{t("depOnly")}</span>
        </label>
      </div>

      {/* FR18.7: Submit button */}
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full py-2 px-4 bg-lvb-yellow hover:bg-lvb-yellow-hover disabled:opacity-60 disabled:cursor-not-allowed text-lvb-dark font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-lvb-yellow focus:outline-none text-sm"
      >
        {isLoading ? t("requesting") : t("submit")}
      </button>
    </div>
  );
}
