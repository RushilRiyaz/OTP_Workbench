import { describe, it, expect } from "vitest";
import { toggleComparisonSelection } from "@/lib/comparisonSelectionUtils";

describe("toggleComparisonSelection", () => {
  it("adds new ref to empty array", () => {
    const result = toggleComparisonSelection([], "prod", 0);
    expect(result).toEqual([{ envId: "prod", itineraryIndex: 0 }]);
  });

  it("adds ref to existing array (< max)", () => {
    const current = [{ envId: "prod", itineraryIndex: 0 }];
    const result = toggleComparisonSelection(current, "stage", 1);
    expect(result).toEqual([
      { envId: "prod", itineraryIndex: 0 },
      { envId: "stage", itineraryIndex: 1 },
    ]);
  });

  it("removes ref when already selected (toggle off)", () => {
    const current = [
      { envId: "prod", itineraryIndex: 0 },
      { envId: "stage", itineraryIndex: 1 },
    ];
    const result = toggleComparisonSelection(current, "prod", 0);
    expect(result).toEqual([{ envId: "stage", itineraryIndex: 1 }]);
  });

  it("caps at max 3 — does not add 4th", () => {
    const current = [
      { envId: "prod", itineraryIndex: 0 },
      { envId: "stage", itineraryIndex: 0 },
      { envId: "dev", itineraryIndex: 0 },
    ];
    const result = toggleComparisonSelection(current, "prod", 1);
    expect(result).toBe(current); // same reference — no mutation
  });

  it("handles duplicate envId with different itineraryIndex", () => {
    const current = [{ envId: "prod", itineraryIndex: 0 }];
    const result = toggleComparisonSelection(current, "prod", 1);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ envId: "prod", itineraryIndex: 1 });
  });

  it("handles same itineraryIndex across different envIds", () => {
    const current = [{ envId: "prod", itineraryIndex: 0 }];
    const result = toggleComparisonSelection(current, "stage", 0);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ envId: "stage", itineraryIndex: 0 });
  });

  it("returns new array reference (immutability)", () => {
    const current = [{ envId: "prod", itineraryIndex: 0 }];
    const added = toggleComparisonSelection(current, "stage", 0);
    expect(added).not.toBe(current);
    const removed = toggleComparisonSelection(current, "prod", 0);
    expect(removed).not.toBe(current);
  });
});
