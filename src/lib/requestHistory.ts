// FR6.4-6.5: Request history management using localStorage

import { RequestHistoryEntry } from "@/lib/types";
import { LocationValue } from "@/components/LocationInput";

const STORAGE_KEY = "otp-request-history";
const MAX_HISTORY_SIZE = 20; // FR6.4: Maintain last 20 requests

// Validate that an item has the expected RequestHistoryEntry shape
function isValidRequestHistoryEntry(item: unknown): item is RequestHistoryEntry {
  if (typeof item !== "object" || item === null) {
    return false;
  }
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.timestamp === "number" &&
    typeof obj.dateTime === "string" &&
    typeof obj.displayLabel === "string" &&
    typeof obj.selectedEnvironment === "string" &&
    typeof obj.start === "object" &&
    typeof obj.destination === "object" &&
    typeof obj.routingOptions === "object"
  );
}

// Generate display label from start and destination
export function generateDisplayLabel(start: LocationValue, destination: LocationValue): string {
  const startName = start.text || "Unknown";
  const destName = destination.text || "Unknown";

  // Truncate if too long
  const maxLen = 25;
  const truncStart = startName.length > maxLen ? startName.slice(0, maxLen) + "..." : startName;
  const truncDest = destName.length > maxLen ? destName.slice(0, maxLen) + "..." : destName;

  return `${truncStart} → ${truncDest}`;
}

export function getRequestHistory(): RequestHistoryEntry[] {
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
      console.warn("Request history is not an array, clearing");
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Filter out any invalid entries
    return parsed.filter(isValidRequestHistoryEntry);
  } catch (error) {
    console.error("Error reading request history:", error);
    return [];
  }
}

export function addToRequestHistory(entry: RequestHistoryEntry): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const history = getRequestHistory();

    // Remove duplicate if exists (based on start+dest+dateTime+env+travelModes)
    const isDuplicate = (item: RequestHistoryEntry) =>
      item.start.text === entry.start.text &&
      item.destination.text === entry.destination.text &&
      item.dateTime === entry.dateTime &&
      item.selectedEnvironment === entry.selectedEnvironment &&
      JSON.stringify(item.routingOptions.travelModes) === JSON.stringify(entry.routingOptions.travelModes);

    const filtered = history.filter((item) => !isDuplicate(item));

    // Add new entry at the beginning
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY_SIZE);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving request history:", error);
  }
}

export function clearRequestHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing request history:", error);
  }
}
