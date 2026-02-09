// Shared test fixtures for FR6 + FR8 unit tests

import type { LocationValue } from "@/components/LocationInput";
import type { RoutingOptions } from "@/components/RoutingOptionsForm";
import type { RequestHistoryEntry } from "@/lib/types";

// --- LocationValue factories ---

export function coordsLocation(lat = 51.34, lon = 12.37): LocationValue {
  return {
    text: `${lat}, ${lon}`,
    type: "coordinates",
    location: null,
    stopId: null,
    coordinates: { lat, lon },
  };
}

export function stopIdLocation(stopId = "12345"): LocationValue {
  return {
    text: `Stop ID: ${stopId}`,
    type: "stopId",
    location: null,
    stopId,
    coordinates: null,
  };
}

export function autocompleteLocation(
  id = "loc-1",
  name = "Augustusplatz",
  lat = 51.3397,
  lon = 12.3816
): LocationValue {
  return {
    text: name,
    type: "autocomplete",
    location: {
      id,
      name,
      data: name,
      lat,
      lon,
      ptype: "",
      stadt: null,
      stadtteil: null,
      postalcode: null,
      landkreis: null,
      streetname: null,
      housenumber: null,
      tags: null,
    },
    stopId: null,
    coordinates: null,
  };
}

export function emptyLocation(): LocationValue {
  return {
    text: "",
    type: null,
    location: null,
    stopId: null,
    coordinates: null,
  };
}

// --- RoutingOptions factory ---

export function defaultOptions(overrides?: Partial<RoutingOptions>): RoutingOptions {
  return {
    timingMode: "departAt",
    travelModes: ["TRANSIT"],
    optionalParams: {
      accessibility: false,
      shortWalk: false,
      lessTransfers: false,
      transitOnly: false,
    },
    customParams: "",
    ...overrides,
  };
}

// --- RequestHistoryEntry factory ---

export function historyEntry(overrides?: Partial<RequestHistoryEntry>): RequestHistoryEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    start: coordsLocation(),
    destination: autocompleteLocation(),
    dateTime: "2026-02-03T14:30",
    routingOptions: defaultOptions(),
    selectedEnvironment: "prod",
    displayLabel: "51.34, 12.37 → Augustusplatz",
    ...overrides,
  };
}
