import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getLocationHistory,
  addToLocationHistory,
  clearLocationHistory,
} from "@/lib/state/locationHistory";
import {
  coordsLocation,
  stopIdLocation,
  autocompleteLocation,
} from "@/test/fixtures";

// FR4.7: Unit tests for location history (last 10 start/destination inputs)

describe("locationHistory", () => {
  // Mock localStorage and window
  let storage: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    // Mock window to be defined (for SSR check)
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getLocationHistory", () => {
    it("returns empty array when no history exists", () => {
      expect(getLocationHistory()).toEqual([]);
    });

    it("returns stored history items", () => {
      const items = [coordsLocation(), autocompleteLocation()];
      storage["otp-location-history"] = JSON.stringify(items);

      const result = getLocationHistory();
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("coordinates");
      expect(result[1].type).toBe("autocomplete");
    });

    it("filters out invalid entries from corrupted data", () => {
      const validItem = coordsLocation();
      const invalidItems = [
        { text: "missing type" }, // missing type field
        { type: "coordinates" }, // missing text field
        null,
        "string instead of object",
      ];
      storage["otp-location-history"] = JSON.stringify([validItem, ...invalidItems]);

      const result = getLocationHistory();
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe(validItem.text);
    });

    it("clears storage and returns empty array when data is not an array", () => {
      storage["otp-location-history"] = JSON.stringify({ notAnArray: true });

      const result = getLocationHistory();
      expect(result).toEqual([]);
      expect(storage["otp-location-history"]).toBeUndefined();
    });

    it("returns empty array and handles JSON parse errors gracefully", () => {
      storage["otp-location-history"] = "invalid json {{{";

      const result = getLocationHistory();
      expect(result).toEqual([]);
    });
  });

  describe("addToLocationHistory", () => {
    it("adds a location to empty history", () => {
      const location = coordsLocation();
      addToLocationHistory(location);

      const history = JSON.parse(storage["otp-location-history"]);
      expect(history).toHaveLength(1);
      expect(history[0].text).toBe(location.text);
    });

    it("adds new location at the beginning", () => {
      const first = coordsLocation(51.0, 12.0);
      const second = autocompleteLocation();

      addToLocationHistory(first);
      addToLocationHistory(second);

      const history = JSON.parse(storage["otp-location-history"]);
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe("autocomplete"); // second added, now first
      expect(history[1].type).toBe("coordinates"); // first added, now second
    });

    it("removes duplicates based on text", () => {
      const location1 = coordsLocation(51.34, 12.37);
      const location2 = autocompleteLocation();
      const location1Again = coordsLocation(51.34, 12.37); // same text

      addToLocationHistory(location1);
      addToLocationHistory(location2);
      addToLocationHistory(location1Again);

      const history = JSON.parse(storage["otp-location-history"]);
      expect(history).toHaveLength(2);
      expect(history[0].text).toBe(location1Again.text); // moved to top
    });

    it("limits history to 10 items (FR4.7 requirement)", () => {
      // Add 12 items
      for (let i = 0; i < 12; i++) {
        addToLocationHistory(coordsLocation(51.0 + i * 0.01, 12.0 + i * 0.01));
      }

      const history = JSON.parse(storage["otp-location-history"]);
      expect(history).toHaveLength(10);
    });

    it("does not save location with null type", () => {
      const emptyLocation = {
        text: "Some text",
        type: null,
        location: null,
        stopId: null,
        coordinates: null,
      };
      addToLocationHistory(emptyLocation);

      expect(storage["otp-location-history"]).toBeUndefined();
    });

    it("does not save location with empty text", () => {
      const location = coordsLocation();
      location.text = "";
      addToLocationHistory(location);

      expect(storage["otp-location-history"]).toBeUndefined();
    });

    it("saves all location types correctly", () => {
      addToLocationHistory(coordsLocation());
      addToLocationHistory(stopIdLocation("12345"));
      addToLocationHistory(autocompleteLocation());

      const history = JSON.parse(storage["otp-location-history"]);
      expect(history).toHaveLength(3);
      expect(history.map((h: { type: string }) => h.type)).toEqual([
        "autocomplete",
        "stopId",
        "coordinates",
      ]);
    });
  });

  describe("clearLocationHistory", () => {
    it("removes all history from localStorage", () => {
      addToLocationHistory(coordsLocation());
      addToLocationHistory(autocompleteLocation());

      clearLocationHistory();

      expect(storage["otp-location-history"]).toBeUndefined();
      expect(getLocationHistory()).toEqual([]);
    });

    it("handles clearing when no history exists", () => {
      // Should not throw
      expect(() => clearLocationHistory()).not.toThrow();
    });
  });
});
