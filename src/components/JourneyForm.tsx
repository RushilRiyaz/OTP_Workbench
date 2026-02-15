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
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
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
        className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-lvb-dark bg-lvb-yellow hover:bg-lvb-yellow-hover disabled:bg-lvb-yellow/60 disabled:cursor-not-allowed rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:ring-offset-2 dark:focus:ring-offset-zinc-900 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span>Requesting...</span>
          </>
        ) : (
          <span>Start Routing</span>
        )}
      </button>

      {/* FR6: API error feedback */}
      {routingError && (
        <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="font-medium">Request failed</div>
          <div className="text-xs mt-1">{routingError.message}</div>
        </div>
      )}
    </div>
  );
}
