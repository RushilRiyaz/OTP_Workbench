import { describe, it, expect } from "vitest";
import { getCoords } from "@/components/map/utils";
import {
  coordsLocation,
  autocompleteLocation,
  stopIdLocation,
  emptyLocation,
} from "@/test/fixtures";

describe("getCoords", () => {
  it("returns null for null input", () => {
    expect(getCoords(null)).toBeNull();
  });

  it("extracts lat/lng from coordinates location", () => {
    const result = getCoords(coordsLocation(51.34, 12.37));
    expect(result).toEqual({ lat: 51.34, lng: 12.37 });
  });

  it("extracts lat/lng from autocomplete location", () => {
    const result = getCoords(autocompleteLocation("loc-1", "Hbf", 51.3, 12.3));
    expect(result).toEqual({ lat: 51.3, lng: 12.3 });
  });

  it("returns null for stopId (no coordinates available)", () => {
    expect(getCoords(stopIdLocation("12345"))).toBeNull();
  });

  it("returns null when both coordinates and location are null", () => {
    expect(getCoords(emptyLocation())).toBeNull();
  });
});
