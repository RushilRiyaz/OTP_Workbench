// Shared test fixtures for unit tests

import type { LocationValue } from "@/components/LocationInput";
import type { RoutingOptions } from "@/components/RoutingOptionsForm";
import type { RequestHistoryEntry } from "@/lib/types";
import type {
  Station,
  FromToLocation,
  NonTransitLeg,
  TransitLeg,
  Itinerary,
  RoutingResponse,
  Alert,
} from "@/lib/routing";

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
    selectedAutocompleteEnv: "prod",
    displayLabel: "51.34, 12.37 → Augustusplatz",
    ...overrides,
  };
}

// --- OTP Response type factories ---

export function createStation(overrides?: Partial<Station>): Station {
  return {
    name: "Leipzig Hbf",
    stopId: "de:14713:8010205",
    lat: 51.3455,
    lon: 12.3822,
    zoneId: "110",
    wheelchairBoarding: 0,
    track: null,
    scheduledTrack: null,
    cancelled: false,
    ...overrides,
  };
}

export function createFromToLocation(overrides?: Partial<FromToLocation>): FromToLocation {
  return {
    name: "Origin",
    lat: 51.34,
    lon: 12.37,
    ...overrides,
  };
}

export function createNonTransitLeg(overrides?: Partial<NonTransitLeg>): NonTransitLeg {
  return {
    startTime: 1738592400000,
    endTime: 1738592700000,
    departureDelay: 0,
    arrivalDelay: 0,
    realTime: false,
    distance: 350,
    duration: 300,
    departureDelayedTime: 1738592400000,
    arrivalDelayedTime: 1738592700000,
    legGeometry: { points: [{ lat: 51.34, lon: 12.37 }, { lat: 51.345, lon: 12.382 }] },
    rentedBike: false,
    alerts: [],
    transitLeg: false,
    mode: "WALK",
    from: createFromToLocation(),
    to: createStation(),
    ...overrides,
  };
}

export function createTransitLeg(overrides?: Partial<TransitLeg>): TransitLeg {
  return {
    startTime: 1738592700000,
    endTime: 1738594200000,
    departureDelay: 60,
    arrivalDelay: 0,
    realTime: true,
    distance: 5400,
    duration: 1500,
    departureDelayedTime: 1738592760000,
    arrivalDelayedTime: 1738594200000,
    legGeometry: { points: [{ lat: 51.345, lon: 12.382 }, { lat: 51.36, lon: 12.40 }] },
    rentedBike: false,
    alerts: [],
    transitLeg: true,
    mode: "TRAM",
    from: createStation({ name: "Leipzig Hbf", stopId: "de:14713:8010205" }),
    to: createStation({ name: "Goerdelerring", stopId: "de:14713:11420" }),
    route: "Linie 15",
    agencyName: "LVB",
    wheelchairAccessible: 0,
    routeColor: "FFD800",
    routeType: 0,
    routeId: "lvb:15",
    headsign: "Miltitz",
    agencyId: "lvb",
    tripId: "lvb:15:1234",
    serviceDate: "20260203",
    routeShortName: "15",
    routeLongName: "Meusdorf - Miltitz",
    intermediateStops: [],
    cancelled: false,
    wheelchairBoardingVehicle: 0,
    ...overrides,
  };
}

export function createItinerary(overrides?: Partial<Itinerary>): Itinerary {
  return {
    duration: 1800,
    startTime: 1738592400000,
    endTime: 1738594200000,
    walkTime: 300,
    transitTime: 1500,
    waitingTime: 0,
    walkDistance: 350,
    transfers: 0,
    legs: [createNonTransitLeg(), createTransitLeg()],
    zoneInfo: null,
    ...overrides,
  };
}

export function createRoutingResponse(overrides?: Partial<RoutingResponse>): RoutingResponse {
  return {
    RetStatus: { Value: "OK", Comments: "" },
    requestParameters: {
      From: "51.34,12.37",
      To: "51.3455,12.3822",
      Travelmode: "TRANSIT",
      changeSource: "",
      transitOnly: false,
      mockup: false,
    },
    plan: {
      date: 1738592400000,
      from: { name: "Start", lon: 12.37, lat: 51.34 },
      to: { name: "Goerdelerring", lon: 12.3822, lat: 51.3455 },
      itineraries: [createItinerary()],
    },
    ...overrides,
  };
}

// --- Alert factory ---

export function createAlert(overrides?: Partial<Alert>): Alert {
  return {
    effectiveStartDate: 1738540800000,
    effectiveEndDate: 1738627200000,
    alertHeaderText: "Service disruption",
    alertDescriptionText: "Tram line 15 is disrupted due to construction work.",
    alertCategory: 0,
    ...overrides,
  };
}
