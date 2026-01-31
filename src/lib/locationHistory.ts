// FR4.7: Location history management using localStorage

import { LocationValue } from "@/components/LocationInput";

const STORAGE_KEY = "otp-location-history";
const MAX_HISTORY_SIZE = 10;

// Validate that an item has the expected LocationValue shape
function isValidLocationValue(item: unknown): item is LocationValue {
  if (typeof item !== "object" || item === null) {
    return false;
  }
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.text === "string" &&
    (obj.type === "autocomplete" || obj.type === "stopId" || obj.type === "coordinates" || obj.type === null)
  );
}

export function getLocationHistory(): LocationValue[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);

    // Validate data shape to handle corrupted/old schema
    if (!Array.isArray(parsed)) {
      console.warn("Location history is not an array, clearing");
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Filter out any invalid entries
    return parsed.filter(isValidLocationValue);
  } catch (error) {
    console.error("Error reading location history:", error);
    return [];
  }
}

export function addToLocationHistory(location: LocationValue): void {
  if (typeof window === "undefined") {
    return;
  }

  // Don't save empty or incomplete locations
  if (!location.type || !location.text) {
    return;
  }

  try {
    const history = getLocationHistory();

    // Remove duplicate if exists (based on text to keep it simple)
    const filtered = history.filter((item) => item.text !== location.text);

    // Add new location at the beginning
    const updated = [location, ...filtered].slice(0, MAX_HISTORY_SIZE);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving location history:", error);
  }
}

export function clearLocationHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing location history:", error);
  }
}
