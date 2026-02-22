import { describe, it, expect } from "vitest";
import { isStation } from "@/lib/routing";
import {
  createStation,
  createFromToLocation,
  createTransitLeg,
  createNonTransitLeg,
  createAlert,
  createItinerary,
} from "@/test/fixtures";

describe("fixture factories", () => {
  it("createStation returns valid Station (isStation = true)", () => {
    const s = createStation();
    expect(s.stopId).toBeDefined();
    expect(typeof s.name).toBe("string");
    expect(isStation(s)).toBe(true);
  });

  it("createFromToLocation returns non-Station (isStation = false)", () => {
    const loc = createFromToLocation();
    expect(isStation(loc)).toBe(false);
    expect(typeof loc.name).toBe("string");
  });

  it("createStation merges overrides while preserving defaults", () => {
    const s = createStation({ name: "Custom", arrivalDelay: 42 });
    expect(s.name).toBe("Custom");
    expect(s.arrivalDelay).toBe(42);
    // default stopId preserved
    expect(s.stopId).toBe("de:14713:8010205");
  });

  it("createTransitLeg has transitLeg=true with Station from/to", () => {
    const leg = createTransitLeg();
    expect(leg.transitLeg).toBe(true);
    expect(isStation(leg.from)).toBe(true);
    expect(isStation(leg.to)).toBe(true);
  });

  it("createNonTransitLeg has transitLeg=false", () => {
    const leg = createNonTransitLeg();
    expect(leg.transitLeg).toBe(false);
  });

  it("createAlert returns valid Alert with overrides", () => {
    const a = createAlert();
    expect(a.alertCategory).toBe(0);
    expect(a.alertDescriptionText).toBeTruthy();
    expect(a.effectiveStartDate).toBeLessThan(a.effectiveEndDate);

    const custom = createAlert({ alertCategory: 3, alertHeaderText: null });
    expect(custom.alertCategory).toBe(3);
    expect(custom.alertHeaderText).toBeNull();
  });

  it("createItinerary contains legs by default", () => {
    const itin = createItinerary();
    expect(itin.legs.length).toBeGreaterThan(0);
    expect(itin.duration).toBeGreaterThan(0);
  });
});
