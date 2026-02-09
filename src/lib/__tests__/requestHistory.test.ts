import { describe, it, expect, vi } from "vitest";
import "@/test/localStorage-mock";
import { localStorageMock } from "@/test/localStorage-mock";
import {
  generateDisplayLabel,
  getRequestHistory,
  addToRequestHistory,
  clearRequestHistory,
} from "@/lib/requestHistory";
import {
  coordsLocation,
  autocompleteLocation,
  emptyLocation,
  defaultOptions,
  historyEntry,
} from "@/test/fixtures";

describe("generateDisplayLabel", () => {
  it("uses short names unchanged", () => {
    const label = generateDisplayLabel(
      coordsLocation(51.34, 12.37),
      autocompleteLocation("loc-1", "Hbf"),
    );
    expect(label).toBe("51.34, 12.37 → Hbf");
  });

  it("truncates names longer than 25 chars", () => {
    const longName = "A".repeat(30);
    const start = { ...coordsLocation(), text: longName };
    const label = generateDisplayLabel(start, autocompleteLocation());
    expect(label).toContain("...");
    expect(label.split(" → ")[0].length).toBe(28); // 25 + "..."
  });

  it("uses 'Unknown' for empty text", () => {
    const label = generateDisplayLabel(emptyLocation(), emptyLocation());
    expect(label).toBe("Unknown → Unknown");
  });

  it("uses arrow separator →", () => {
    const label = generateDisplayLabel(coordsLocation(), autocompleteLocation());
    expect(label).toContain(" → ");
  });
});

describe("localStorage operations", () => {
  it("returns empty array when nothing stored", () => {
    expect(getRequestHistory()).toEqual([]);
  });

  it("add + get works", () => {
    const entry = historyEntry({ id: "test-1" });
    addToRequestHistory(entry);
    const history = getRequestHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("test-1");
  });

  it("newest entry appears first", () => {
    addToRequestHistory(historyEntry({ id: "old", dateTime: "2026-01-01T10:00" }));
    addToRequestHistory(historyEntry({ id: "new", dateTime: "2026-02-01T10:00" }));
    const history = getRequestHistory();
    expect(history[0].id).toBe("new");
  });

  it("deduplicates entries with same start+dest+dateTime+env+modes", () => {
    const base = {
      start: coordsLocation(51.34, 12.37),
      destination: autocompleteLocation("loc-1", "Hbf"),
      dateTime: "2026-02-03T14:30",
      selectedEnvironment: "prod",
      routingOptions: defaultOptions(),
    };
    addToRequestHistory(historyEntry({ ...base, id: "first" }));
    addToRequestHistory(historyEntry({ ...base, id: "second" }));
    const history = getRequestHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("second");
  });

  it("caps at 20 entries, dropping oldest", () => {
    for (let i = 0; i < 21; i++) {
      addToRequestHistory(historyEntry({
        id: `entry-${i}`,
        // Vary dateTime so they aren't deduped
        dateTime: `2026-01-${String(i + 1).padStart(2, "0")}T10:00`,
      }));
    }
    const history = getRequestHistory();
    expect(history).toHaveLength(20);
    // Newest should be first
    expect(history[0].id).toBe("entry-20");
  });

  it("clearRequestHistory removes all entries", () => {
    addToRequestHistory(historyEntry({ id: "to-clear" }));
    clearRequestHistory();
    expect(getRequestHistory()).toEqual([]);
  });

  it("returns empty array and clears storage for corrupted JSON", () => {
    localStorageMock.getItem.mockReturnValueOnce("{invalid json");
    // Suppress console.error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = getRequestHistory();
    expect(result).toEqual([]);
    spy.mockRestore();
  });

  it("returns empty array and clears storage for non-array JSON", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ not: "array" }));
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = getRequestHistory();
    expect(result).toEqual([]);
    expect(localStorageMock.removeItem).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("filters out entries with invalid shape", () => {
    const validEntry = historyEntry({ id: "valid" });
    const invalidEntry = { id: "invalid" }; // missing required fields
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([validEntry, invalidEntry]));
    const result = getRequestHistory();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("valid");
  });
});
