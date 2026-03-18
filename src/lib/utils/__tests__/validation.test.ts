import { describe, it, expect } from "vitest";
import { validateRoutingParams } from "@/lib/utils/validation";
import {
  coordsLocation,
  stopIdLocation,
  autocompleteLocation,
  emptyLocation,
  defaultOptions,
} from "@/test/fixtures";

describe("validateRoutingParams", () => {
  const validParams = () => ({
    start: coordsLocation(),
    destination: autocompleteLocation(),
    dateTime: "2026-02-03T14:30",
    routingOptions: defaultOptions(),
  });

  it("returns no errors for valid inputs", () => {
    expect(validateRoutingParams(validParams())).toEqual([]);
  });

  // --- Start validation ---

  it("errors when start type is null", () => {
    const params = { ...validParams(), start: emptyLocation() };
    const errors = validateRoutingParams(params);
    expect(errors).toContainEqual(expect.objectContaining({ field: "start" }));
  });

  it("errors when start is coordinates but coordinates is null", () => {
    const start = coordsLocation();
    start.coordinates = null;
    const errors = validateRoutingParams({ ...validParams(), start });
    expect(errors).toContainEqual(expect.objectContaining({ field: "start" }));
  });

  it("errors when start is stopId but stopId is empty", () => {
    const start = stopIdLocation("");
    const errors = validateRoutingParams({ ...validParams(), start });
    expect(errors).toContainEqual(expect.objectContaining({ field: "start" }));
  });

  it("errors when start is autocomplete but location is null", () => {
    const start = autocompleteLocation();
    start.location = null;
    const errors = validateRoutingParams({ ...validParams(), start });
    expect(errors).toContainEqual(expect.objectContaining({ field: "start" }));
  });

  // --- Destination validation ---

  it("errors when destination type is null", () => {
    const params = { ...validParams(), destination: emptyLocation() };
    const errors = validateRoutingParams(params);
    expect(errors).toContainEqual(expect.objectContaining({ field: "destination" }));
  });

  // --- DateTime validation ---

  it("errors when dateTime is empty", () => {
    const errors = validateRoutingParams({ ...validParams(), dateTime: "" });
    expect(errors).toContainEqual(expect.objectContaining({ field: "dateTime" }));
  });

  it("errors when dateTime is whitespace", () => {
    const errors = validateRoutingParams({ ...validParams(), dateTime: "   " });
    expect(errors).toContainEqual(expect.objectContaining({ field: "dateTime" }));
  });

  // --- Travel modes validation ---

  it("errors when no travel modes selected", () => {
    const routingOptions = defaultOptions({ travelModes: [] });
    const errors = validateRoutingParams({ ...validParams(), routingOptions });
    expect(errors).toContainEqual(expect.objectContaining({ field: "travelModes" }));
  });

  // --- Multiple errors ---

  it("returns multiple errors when all fields invalid", () => {
    const errors = validateRoutingParams({
      start: emptyLocation(),
      destination: emptyLocation(),
      dateTime: "",
      routingOptions: defaultOptions({ travelModes: [] }),
    });
    expect(errors).toHaveLength(4);
  });

  // --- Valid stopId passes ---

  it("accepts valid stopId location", () => {
    const params = { ...validParams(), start: stopIdLocation("99001") };
    expect(validateRoutingParams(params)).toEqual([]);
  });
});
