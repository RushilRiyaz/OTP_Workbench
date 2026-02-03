"use client";

import { useState } from "react";
import LocationInput, { LocationValue } from "./LocationInput";
import DateTimeInput from "./DateTimeInput";

interface JourneyFormProps {
  start: LocationValue;
  destination: LocationValue;
  onStartChange: (value: LocationValue) => void;
  onDestinationChange: (value: LocationValue) => void;
}

export default function JourneyForm({
  start,
  destination,
  onStartChange,
  onDestinationChange,
}: JourneyFormProps) {
  const [dateTime, setDateTime] = useState("");

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
      />

      {/* FR4.9: Swap button */}
      <div className="flex justify-center -my-1">
        <button
          type="button"
          onClick={handleSwap}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      />
      <DateTimeInput
        label="Date & Time"
        value={dateTime}
        onChange={setDateTime}
        required
      />
    </div>
  );
}
