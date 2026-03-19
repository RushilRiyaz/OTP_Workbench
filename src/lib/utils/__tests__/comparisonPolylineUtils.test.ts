import { describe, it, expect } from "vitest";
import { computePolylineStyle } from "@/lib/utils/comparisonPolylineUtils";

describe("computePolylineStyle", () => {
  it("no hover + walk → opacity 0.7, weight 5", () => {
    expect(computePolylineStyle({ isWalk: true, hoveredLeg: null, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 0.7, weight: 5 });
  });

  it("no hover + transit → opacity 0.85, weight 4", () => {
    expect(computePolylineStyle({ isWalk: false, hoveredLeg: null, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 0.85, weight: 4 });
  });

  it("hovered leg exactly → opacity 1, weight 7 (walk)", () => {
    const hoveredLeg = { slotIndex: 1, legIndex: 2 };
    expect(computePolylineStyle({ isWalk: true, hoveredLeg, slotIndex: 1, legIndex: 2 }))
      .toEqual({ opacity: 1, weight: 7 });
  });

  it("hovered leg exactly → opacity 1, weight 7 (transit)", () => {
    const hoveredLeg = { slotIndex: 0, legIndex: 0 };
    expect(computePolylineStyle({ isWalk: false, hoveredLeg, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 1, weight: 7 });
  });

  it("same itinerary, different leg (walk) → opacity 0.5, weight 5", () => {
    const hoveredLeg = { slotIndex: 0, legIndex: 1 };
    expect(computePolylineStyle({ isWalk: true, hoveredLeg, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 0.5, weight: 5 });
  });

  it("same itinerary, different leg (transit) → opacity 0.5, weight 4", () => {
    const hoveredLeg = { slotIndex: 0, legIndex: 1 };
    expect(computePolylineStyle({ isWalk: false, hoveredLeg, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 0.5, weight: 4 });
  });

  it("different itinerary (walk) → opacity 0.2, weight 5", () => {
    const hoveredLeg = { slotIndex: 1, legIndex: 0 };
    expect(computePolylineStyle({ isWalk: true, hoveredLeg, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 0.2, weight: 5 });
  });

  it("different itinerary (transit) → opacity 0.2, weight 4", () => {
    const hoveredLeg = { slotIndex: 1, legIndex: 0 };
    expect(computePolylineStyle({ isWalk: false, hoveredLeg, slotIndex: 0, legIndex: 0 }))
      .toEqual({ opacity: 0.2, weight: 4 });
  });
});
