"use client";

import LocationInput, { LocationValue } from "./LocationInput";
import DateTimeInput from "./DateTimeInput";
import RoutingOptionsForm, { RoutingOptions } from "./RoutingOptionsForm";
import { ValidationError } from "@/lib/types";
import { RoutingError } from "@/lib/routing";

interface JourneyFormProps {
  start: LocationValue;
  destination: LocationValue;
  onStartChange: (value: LocationValue) => void;
  onDestinationChange: (value: LocationValue) => void;
  // FR6: Lifted state
  dateTime: string;
  onDateTimeChange: (value: string) => void;
  routingOptions: RoutingOptions;
  onRoutingOptionsChange: (value: RoutingOptions) => void;
  validationErrors: ValidationError[];
  isLoading: boolean;
  onSubmit: () => void; // FR6.1: Start routing request
  routingError: RoutingError | null; // FR6: API error feedback
}

export default function JourneyForm({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  dateTime,
  onDateTimeChange,
  routingOptions,
  onRoutingOptionsChange,
  validationErrors,
  isLoading,
  onSubmit,
  routingError,
}: JourneyFormProps) {
  // Helper to get error for a field
  const getFieldError = (field: ValidationError["field"]): string | undefined => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  // FR4.9: Swap start and destination
  const handleSwap = () => {
    const tempStart = start;
    onStartChange(destination);
    onDestinationChange(tempStart);
  };

  return (
    <div className="flex flex-col gap-4">
      <LocationInput
        label="Start"
        value={start}
        onChange={onStartChange}
        placeholder="Enter start location"
        required
        error={getFieldError("start")}
      />

      {/* FR4.9: Swap button */}
      <div className="flex justify-center -my-1">
        <button
          type="button"
          onClick={handleSwap}
          disabled={isLoading}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all hover:scale-110 active:scale-95 hover:border-lvb-yellow/50 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
          title="Swap start and destination"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <LocationInput
        label="Destination"
        value={destination}
        onChange={onDestinationChange}
        placeholder="Enter destination"
        required
        error={getFieldError("destination")}
      />
      <DateTimeInput
        label="Date & Time"
        value={dateTime}
        onChange={onDateTimeChange}
        required
        error={getFieldError("dateTime")}
      />

      {/* FR5: Routing Options */}
      <RoutingOptionsForm
        value={routingOptions}
        onChange={onRoutingOptionsChange}
        error={getFieldError("travelModes")}
      />

      {/* FR6.1: Start Routing Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="w-full mt-2 px-4 py-3 text-sm font-semibold text-lvb-dark bg-lvb-yellow hover:bg-lvb-yellow-hover disabled:bg-lvb-yellow/60 disabled:cursor-not-allowed rounded-xl shadow-[0_2px_8px_0_rgb(251,193,15,0.35)] hover:shadow-[0_4px_12px_0_rgb(251,193,15,0.45)] active:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:ring-offset-2 dark:focus:ring-offset-zinc-900 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-lvb-dark/30 border-t-lvb-dark rounded-full animate-spin" aria-hidden="true" />
            <span>Requesting...</span>
          </>
        ) : (
          <span>Start Routing</span>
        )}
      </button>

      {/* FR6: API error feedback */}
      {routingError && (
        <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-medium">Request failed</div>
            <div className="text-xs mt-1">{routingError.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
