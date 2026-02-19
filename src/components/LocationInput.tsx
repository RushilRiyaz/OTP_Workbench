"use client";

import { useState, useEffect, useRef } from "react";
import { searchLocations, AutocompleteResult } from "@/lib/autocomplete";
import { getLocationHistory, addToLocationHistory } from "@/lib/locationHistory";
import { reverseGeocode } from "@/lib/reverseGeocode";

export interface LocationValue {
  text: string;
  type: "autocomplete" | "stopId" | "coordinates" | null;
  location: AutocompleteResult | null;
  stopId: string | null;
  coordinates: { lat: number; lon: number } | null;
}

export const emptyLocationValue: LocationValue = {
  text: "",
  type: null,
  location: null,
  stopId: null,
  coordinates: null,
};

interface LocationInputProps {
  label: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  placeholder?: string;
  required?: boolean;
  error?: string; // FR6: Validation error message
}

function isStopId(input: string): boolean {
  return /^\d+$/.test(input.trim());
}

// FR4.6: Parse coordinate input
// Supports formats: "51.34, 12.37", "51.34,12.37", "51.34 12.37"
function parseCoordinates(input: string): { lat: number; lon: number } | null {
  const trimmed = input.trim();

  // Match patterns: "lat, lon" or "lat,lon" or "lat lon"
  // Coordinates can be negative and must have valid decimal format
  const regex = /^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/;
  const match = trimmed.match(regex);

  if (!match) {
    return null;
  }

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  // Validate ranges: lat (-90 to 90), lon (-180 to 180)
  if (isNaN(lat) || isNaN(lon)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}

export default function LocationInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isStopIdInput, setIsStopIdInput] = useState(false);
  const [isCoordinatesInput, setIsCoordinatesInput] = useState(false);
  const [parsedCoordinates, setParsedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [history, setHistory] = useState<LocationValue[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  // Reset highlighted index when dropdown content changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions, history, showHistory, isStopIdInput, isCoordinatesInput]);

  // Get the total number of selectable items in the dropdown
  const getDropdownItemCount = (): number => {
    if (showHistory && history.length > 0) return history.length;
    if (isCoordinatesInput && parsedCoordinates) return 1;
    if (isStopIdInput) return 1;
    return suggestions.length;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    const itemCount = getDropdownItemCount();

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (showHistory && history.length > 0) {
            handleSelectFromHistory(history[highlightedIndex]);
          } else if (isCoordinatesInput && parsedCoordinates) {
            handleSelectCoordinates(parsedCoordinates);
          } else if (isStopIdInput) {
            handleSelectStopId(value.text.trim());
          } else if (suggestions[highlightedIndex]) {
            handleSelectLocation(suggestions[highlightedIndex]);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputChange = (text: string) => {
    onChange({ ...emptyLocationValue, text });
    setShowHistory(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsStopIdInput(false);
      setIsCoordinatesInput(false);
      setParsedCoordinates(null);
      return;
    }

    // FR4.6: Check for coordinates first (before stop ID, since coords contain digits)
    const coords = parseCoordinates(text);
    if (coords) {
      setIsCoordinatesInput(true);
      setParsedCoordinates(coords);
      setIsStopIdInput(false);
      setSuggestions([]);
      setShowDropdown(true);
      setIsLoading(false);
      return;
    }

    setIsCoordinatesInput(false);
    setParsedCoordinates(null);

    // Check if input is a stop ID (only digits)
    if (isStopId(text)) {
      setIsStopIdInput(true);
      setSuggestions([]);
      setShowDropdown(true);
      setIsLoading(false);
      return;
    }

    setIsStopIdInput(false);

    debounceRef.current = setTimeout(async () => {
      // Cancel any in-flight request before starting new one
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      try {
        const results = await searchLocations({
          search: text,
          signal: abortControllerRef.current.signal,
        });
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        // Ignore abort errors - they're expected when user types quickly
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectLocation = (location: AutocompleteResult) => {
    const locationValue: LocationValue = {
      text: location.name,
      type: "autocomplete",
      location,
      stopId: null,
      coordinates: null,
    };
    onChange(locationValue);
    addToLocationHistory(locationValue);
    setShowDropdown(false);
    setSuggestions([]);
    setShowHistory(false);
  };

  const handleSelectStopId = (stopId: string) => {
    const locationValue: LocationValue = {
      text: `Stop ID: ${stopId}`,
      type: "stopId",
      location: null,
      stopId,
      coordinates: null,
    };
    onChange(locationValue);
    addToLocationHistory(locationValue);
    setShowDropdown(false);
    setIsStopIdInput(false);
    setShowHistory(false);
  };

  // FR4.6: Handle coordinate selection
  const handleSelectCoordinates = (coords: { lat: number; lon: number }) => {
    const locationValue: LocationValue = {
      text: `${coords.lat}, ${coords.lon}`,
      type: "coordinates",
      location: null,
      stopId: null,
      coordinates: coords,
    };
    onChange(locationValue);
    addToLocationHistory(locationValue);
    setShowDropdown(false);
    setIsCoordinatesInput(false);
    setParsedCoordinates(null);
    setShowHistory(false);

    // Resolve address in background — update text on success
    reverseGeocode(coords.lat, coords.lon).then((address) => {
      if (address) {
        const updated = { ...locationValue, text: address };
        onChange(updated);
      }
    });
  };

  // FR4.7: Handle selection from history
  const handleSelectFromHistory = (historyItem: LocationValue) => {
    onChange(historyItem);
    addToLocationHistory(historyItem); // Move to top of history
    setShowDropdown(false);
    setShowHistory(false);
  };

  // FR4.8: Clear input field
  const handleClear = () => {
    onChange(emptyLocationValue);
    setSuggestions([]);
    setShowDropdown(false);
    setIsStopIdInput(false);
    setIsCoordinatesInput(false);
    setParsedCoordinates(null);
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={wrapperRef}>
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value.text}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (isCoordinatesInput || isStopIdInput || suggestions.length > 0) {
              setShowDropdown(true);
            } else if (value.text.length === 0) {
              // FR4.7: Show history when input is empty
              const locationHistory = getLocationHistory();
              if (locationHistory.length > 0) {
                setHistory(locationHistory);
                setShowHistory(true);
                setShowDropdown(true);
              }
            }
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 text-sm rounded-lg border shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors ${value.text ? "pr-8" : ""} ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-zinc-200 dark:border-zinc-700 focus:ring-lvb-yellow focus:border-lvb-yellow/50"
          }`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-zinc-300 border-t-lvb-yellow rounded-full animate-spin" />
          </div>
        )}
        {/* FR4.8: Clear button */}
        {value.text && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow rounded"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 max-h-60 overflow-y-auto z-50"
        >
          {showHistory && history.length > 0 ? (
            <>
              <li className="px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900">
                Recent Locations
              </li>
              {history.map((item, index) => (
                <li
                  key={`history-${item.text}-${item.type}`}
                  className="border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectFromHistory(item)}
                    className={`w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 text-left focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                      highlightedIndex === index ? "bg-lvb-yellow/8 dark:bg-lvb-yellow/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div className="font-medium">{item.text}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.type === "autocomplete" && "Location"}
                      {item.type === "stopId" && "Stop ID"}
                      {item.type === "coordinates" && "Coordinates"}
                    </div>
                  </button>
                </li>
              ))}
            </>
          ) : isCoordinatesInput && parsedCoordinates ? (
            <li>
              <button
                type="button"
                onClick={() => handleSelectCoordinates(parsedCoordinates)}
                className={`w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 text-left focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                  highlightedIndex === 0 ? "bg-lvb-yellow/8 dark:bg-lvb-yellow/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                <div className="font-medium">Use as Coordinates</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Lat: {parsedCoordinates.lat}, Lon: {parsedCoordinates.lon}
                </div>
              </button>
            </li>
          ) : isStopIdInput ? (
            <li>
              <button
                type="button"
                onClick={() => handleSelectStopId(value.text.trim())}
                className={`w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 text-left focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                  highlightedIndex === 0 ? "bg-lvb-yellow/8 dark:bg-lvb-yellow/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                <div className="font-medium">Use as Stop ID</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {value.text.trim()}
                </div>
              </button>
            </li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className="border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => handleSelectLocation(suggestion)}
                  className={`w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 text-left focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                    highlightedIndex === index ? "bg-lvb-yellow/8 dark:bg-lvb-yellow/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  <div className="font-medium">{suggestion.name}</div>
                  {suggestion.data && suggestion.data !== suggestion.name && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {suggestion.data}
                    </div>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* FR6: Validation error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
