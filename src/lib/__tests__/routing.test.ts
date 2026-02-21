import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatLocation,
  formatDate,
  formatTime,
  fetchRouting,
  normalizeStationDelays,
  isStation,
} from "@/lib/routing";
import type { RoutingRequestParams, RoutingResponse } from "@/lib/routing";
import {
  coordsLocation,
  stopIdLocation,
  autocompleteLocation,
  emptyLocation,
  defaultOptions,
  createRoutingResponse,
  createItinerary,
  createTransitLeg,
  createNonTransitLeg,
  createStation,
  createFromToLocation,
} from "@/test/fixtures";

// --- Pure helper tests ---

describe("formatLocation", () => {
  it("formats coordinates as lat,lon", () => {
    expect(formatLocation(coordsLocation(51.34, 12.37))).toBe("51.34,12.37");
  });

  it("formats stopId as the id string", () => {
    expect(formatLocation(stopIdLocation("99001"))).toBe("99001");
  });

  it("formats autocomplete as lat,lon", () => {
    expect(formatLocation(autocompleteLocation("loc-1", "Hbf", 51.3, 12.3))).toBe("51.3,12.3");
  });

  it("returns empty string for empty location", () => {
    expect(formatLocation(emptyLocation())).toBe("");
  });

  it("returns empty string when coordinates type but coordinates null", () => {
    const loc = coordsLocation();
    loc.coordinates = null;
    expect(formatLocation(loc)).toBe("");
  });
});

describe("formatDate", () => {
  it("converts YYYY-MM-DDTHH:mm to MM-DD-YYYY", () => {
    expect(formatDate("2026-02-03T14:30")).toBe("02-03-2026");
  });

  it("handles single digit month/day", () => {
    expect(formatDate("2026-01-05T09:00")).toBe("01-05-2026");
  });
});

describe("formatTime", () => {
  it("extracts HH:mm from datetime-local string", () => {
    expect(formatTime("2026-02-03T14:30")).toBe("14:30");
  });

  it("handles midnight", () => {
    expect(formatTime("2026-02-03T00:00")).toBe("00:00");
  });
});

// --- fetchRouting with mocked fetch ---

describe("fetchRouting", () => {
  const makeParams = (overrides?: Partial<RoutingRequestParams>): RoutingRequestParams => ({
    start: coordsLocation(51.34, 12.37),
    destination: autocompleteLocation("loc-1", "Hbf", 51.3, 12.3),
    dateTime: "2026-02-03T14:30",
    routingOptions: defaultOptions(),
    ...overrides,
  });

  const okResponse: RoutingResponse = {
    RetStatus: { Value: "OK", Comments: "" },
    requestParameters: {
      From: "51.34,12.37",
      To: "51.3,12.3",
      Travelmode: "TRANSIT",
      changeSource: "",
      transitOnly: false,
      mockup: false,
    },
    plan: {
      date: 1738592400000,
      from: { name: "Start", lon: 12.37, lat: 51.34 },
      to: { name: "Hbf", lon: 12.3, lat: 51.3 },
      itineraries: [],
    },
  };

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchResponse(body: unknown, status = 200, ok = true) {
    fetchSpy.mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Internal Server Error",
      json: () => Promise.resolve(body),
    });
  }

  it("builds correct URL params", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams());

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("From")).toBe("51.34,12.37");
    expect(url.searchParams.get("To")).toBe("51.3,12.3");
    expect(url.searchParams.get("Travelmode")).toBe("TRANSIT");
    expect(url.searchParams.get("date")).toBe("02-03-2026");
    expect(url.searchParams.get("time")).toBe("14:30");
    expect(url.searchParams.get("arriveBy")).toBe("false");
  });

  it("sets arriveBy=true when timing mode is arriveBy", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams({
      routingOptions: defaultOptions({ timingMode: "arriveBy" }),
    }));

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("arriveBy")).toBe("true");
  });

  it("adds optional params when enabled", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams({
      routingOptions: defaultOptions({
        optionalParams: { shortWalk: true, lessTransfers: true, accessibility: false, transitOnly: false },
      }),
    }));

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("shortWalk")).toBe("1");
    expect(url.searchParams.get("lessTransfers")).toBe("1");
    expect(url.searchParams.has("accessibility")).toBe(false);
    expect(url.searchParams.has("transitOnly")).toBe(false);
  });

  it("sets numItineraries=3 by default", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams());

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("numItineraries")).toBe("3");
  });

  it("custom params override numItineraries", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams({
      routingOptions: defaultOptions({ customParams: "numItineraries=5" }),
    }));

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("numItineraries")).toBe("5");
  });

  it("protected params cannot be overridden by custom params", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams({
      routingOptions: defaultOptions({ customParams: "From=HACKED&To=HACKED" }),
    }));

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("From")).toBe("51.34,12.37");
    expect(url.searchParams.get("To")).toBe("51.3,12.3");
  });

  it("appends api_key", async () => {
    mockFetchResponse(okResponse);
    await fetchRouting(makeParams());

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.has("api_key")).toBe(true);
  });

  it("returns success for OK response", async () => {
    mockFetchResponse(okResponse);
    const result = await fetchRouting(makeParams());
    expect(result).toEqual({ success: true, data: okResponse });
  });

  it("returns api error for non-OK RetStatus", async () => {
    mockFetchResponse({
      RetStatus: { Value: "ERROR", Comments: "No route found" },
      requestParameters: okResponse.requestParameters,
    });
    const result = await fetchRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.message).toContain("No route found");
    }
  });

  it("returns api error for HTTP 500", async () => {
    mockFetchResponse(null, 500, false);
    const result = await fetchRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.status).toBe(500);
    }
  });

  it("returns parse error for non-JSON response", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("invalid json")),
    });
    const result = await fetchRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("parse");
    }
  });

  it("returns network error for fetch failure", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await fetchRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("network");
    }
  });

  it("returns timeout error for AbortError", async () => {
    const abortErr = new DOMException("The operation was aborted", "AbortError");
    fetchSpy.mockRejectedValue(abortErr);
    const result = await fetchRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("timeout");
    }
  });
});

// --- normalizeStationDelays ---

describe("normalizeStationDelays", () => {
  it("converts TransitLeg Station delays from minutes to seconds", () => {
    const response = createRoutingResponse({
      plan: {
        date: 0,
        from: { name: "A", lon: 12, lat: 51 },
        to: { name: "B", lon: 12, lat: 51 },
        itineraries: [
          createItinerary({
            legs: [
              createTransitLeg({
                from: createStation({ departureDelay: 3 }),
                to: createStation({ arrivalDelay: 5 }),
                intermediateStops: [
                  createStation({ departureDelay: 2, arrivalDelay: 1 }),
                ],
              }),
            ],
          }),
        ],
      },
    });

    const result = normalizeStationDelays(response);
    const leg = result.plan!.itineraries[0].legs[0];
    if (!leg.transitLeg) throw new Error("expected transit leg");

    expect(leg.from.departureDelay).toBe(180);
    expect(leg.to.arrivalDelay).toBe(300);
    expect(leg.intermediateStops[0].departureDelay).toBe(120);
    expect(leg.intermediateStops[0].arrivalDelay).toBe(60);
  });

  it("leaves undefined delays untouched", () => {
    const response = createRoutingResponse({
      plan: {
        date: 0,
        from: { name: "A", lon: 12, lat: 51 },
        to: { name: "B", lon: 12, lat: 51 },
        itineraries: [
          createItinerary({
            legs: [
              createTransitLeg({
                from: createStation(),
                to: createStation(),
                intermediateStops: [],
              }),
            ],
          }),
        ],
      },
    });

    const result = normalizeStationDelays(response);
    const leg = result.plan!.itineraries[0].legs[0];
    if (!leg.transitLeg) throw new Error("expected transit leg");
    expect(leg.from.departureDelay).toBeUndefined();
    expect(leg.to.arrivalDelay).toBeUndefined();
  });

  it("converts NonTransitLeg Station from/to delays", () => {
    const response = createRoutingResponse({
      plan: {
        date: 0,
        from: { name: "A", lon: 12, lat: 51 },
        to: { name: "B", lon: 12, lat: 51 },
        itineraries: [
          createItinerary({
            legs: [
              createNonTransitLeg({
                from: createStation({ departureDelay: 2 }),
                to: createStation({ arrivalDelay: 4 }),
              }),
            ],
          }),
        ],
      },
    });

    const result = normalizeStationDelays(response);
    const leg = result.plan!.itineraries[0].legs[0];
    if (leg.transitLeg) throw new Error("expected non-transit leg");
    expect(isStation(leg.from)).toBe(true);
    expect(isStation(leg.to)).toBe(true);
    if (isStation(leg.from)) expect(leg.from.departureDelay).toBe(120);
    if (isStation(leg.to)) expect(leg.to.arrivalDelay).toBe(240);
  });

  it("does not convert FromToLocation delays", () => {
    const response = createRoutingResponse({
      plan: {
        date: 0,
        from: { name: "A", lon: 12, lat: 51 },
        to: { name: "B", lon: 12, lat: 51 },
        itineraries: [
          createItinerary({
            legs: [
              createNonTransitLeg({
                from: createFromToLocation({ departureDelay: 120 }),
                to: createFromToLocation({ arrivalDelay: 60 }),
              }),
            ],
          }),
        ],
      },
    });

    const result = normalizeStationDelays(response);
    const leg = result.plan!.itineraries[0].legs[0];
    if (leg.transitLeg) throw new Error("expected non-transit leg");
    expect(isStation(leg.from)).toBe(false);
    expect(isStation(leg.to)).toBe(false);
    if (!isStation(leg.from)) expect(leg.from.departureDelay).toBe(120);
    if (!isStation(leg.to)) expect(leg.to.arrivalDelay).toBe(60);
  });

  it("returns response unchanged when no plan", () => {
    const response = createRoutingResponse({ plan: undefined });
    const result = normalizeStationDelays(response);
    expect(result.plan).toBeUndefined();
  });
});
