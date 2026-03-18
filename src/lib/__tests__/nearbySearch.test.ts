// FR22-FR25: Unit tests for nearbySearch.ts API client & helpers

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchNearbySearch,
  categorizeItem,
  getStationCount,
  NEARBY_TYPES,
  NEARBY_VEHICLE_TYPES,
  NEARBY_SOURCES,
  type NearbySearchItem,
  type NearbySearchParams,
} from "@/lib/nearbySearch";

// --- Helpers ---

function createNearbyItem(overrides: Partial<NearbySearchItem> = {}): NearbySearchItem {
  return {
    id: "nextbike-12345",
    name: "BIKE 12345",
    lat: 51.3397,
    lon: 12.3731,
    type: "free_floating",
    source: "nextbike",
    provider: "nextbike Leipzig",
    data: {},
    prov_id: "nextbike-nextbike Leipzig",
    mobistation_id: null,
    ...overrides,
  };
}

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Bad Request",
      json: () => Promise.resolve(body),
    })
  );
}

function getMockedFetch() {
  return vi.mocked(fetch);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// --- Constants ---

describe("NEARBY_TYPES", () => {
  it("contains all expected types", () => {
    expect(NEARBY_TYPES).toContain("station");
    expect(NEARBY_TYPES).toContain("stop");
    expect(NEARBY_TYPES).toContain("free_floating");
    expect(NEARBY_TYPES).toContain("parkingarea");
    expect(NEARBY_TYPES).toContain("operationarea");
    expect(NEARBY_TYPES).toContain("mobistation");
    expect(NEARBY_TYPES).toHaveLength(6);
  });
});

describe("NEARBY_VEHICLE_TYPES", () => {
  it("contains car and bike", () => {
    expect(NEARBY_VEHICLE_TYPES).toContain("car");
    expect(NEARBY_VEHICLE_TYPES).toContain("bike");
    expect(NEARBY_VEHICLE_TYPES).toHaveLength(2);
  });
});

describe("NEARBY_SOURCES", () => {
  it("contains all expected sources", () => {
    expect(NEARBY_SOURCES).toHaveLength(10);
    expect(NEARBY_SOURCES).toContain("nextbike");
    expect(NEARBY_SOURCES).toContain("escooter");
    expect(NEARBY_SOURCES).toContain("lvb");
    expect(NEARBY_SOURCES).toContain("gtfs-mdv");
  });
});

// --- categorizeItem ---

describe("categorizeItem", () => {
  it("returns 'bike' for nextbike free_floating item", () => {
    const item = createNearbyItem({ source: "nextbike", type: "free_floating" });
    expect(categorizeItem(item)).toBe("bike");
  });

  it("returns 'bike_station' for nextbike station item", () => {
    const item = createNearbyItem({ source: "nextbike", type: "station" });
    expect(categorizeItem(item)).toBe("bike_station");
  });

  it("returns 'bike' for item with vehicletype=bike in data", () => {
    const item = createNearbyItem({
      source: "cantamen",
      type: "free_floating",
      data: { vehicletype: "bike" },
    });
    expect(categorizeItem(item)).toBe("bike");
  });

  it("returns 'bike_station' for station with vehicletype=bike in data", () => {
    const item = createNearbyItem({
      source: "cantamen",
      type: "station",
      data: { vehicletype: "bike" },
    });
    expect(categorizeItem(item)).toBe("bike_station");
  });

  it("returns 'escooter' for escooter source free_floating item", () => {
    const item = createNearbyItem({ source: "escooter", type: "free_floating" });
    expect(categorizeItem(item)).toBe("escooter");
  });

  it("returns 'escooter_station' for escooter source station item", () => {
    const item = createNearbyItem({ source: "escooter", type: "station" });
    expect(categorizeItem(item)).toBe("escooter_station");
  });

  it("returns 'escooter' for item with vehicletype=escooter in data", () => {
    const item = createNearbyItem({
      source: "other",
      type: "free_floating",
      data: { vehicletype: "escooter" },
    });
    expect(categorizeItem(item)).toBe("escooter");
  });

  it("returns 'mobistation' for mobistation type", () => {
    const item = createNearbyItem({ type: "mobistation", source: "other" });
    expect(categorizeItem(item)).toBe("mobistation");
  });

  it("returns 'mobistation' for lvb source", () => {
    const item = createNearbyItem({ source: "lvb", type: "stop" });
    expect(categorizeItem(item)).toBe("mobistation");
  });

  it("returns 'other' for unrecognized item", () => {
    const item = createNearbyItem({ source: "taxi", type: "parkingarea", data: {} });
    expect(categorizeItem(item)).toBe("other");
  });
});

// --- getStationCount ---

describe("getStationCount", () => {
  it("returns num_available_vehicles when present as number", () => {
    const item = createNearbyItem({ data: { num_available_vehicles: 5 } });
    expect(getStationCount(item)).toBe(5);
  });

  it("returns num_available_vehicles when present as string", () => {
    const item = createNearbyItem({ data: { num_available_vehicles: "7" } });
    expect(getStationCount(item)).toBe(7);
  });

  it("falls back to num_vehicles when num_available_vehicles is absent", () => {
    const item = createNearbyItem({ data: { num_vehicles: 3 } });
    expect(getStationCount(item)).toBe(3);
  });

  it("falls back to num_vehicles as string", () => {
    const item = createNearbyItem({ data: { num_vehicles: "12" } });
    expect(getStationCount(item)).toBe(12);
  });

  it("falls back to available_bikes when others are absent", () => {
    const item = createNearbyItem({ data: { available_bikes: 8 } });
    expect(getStationCount(item)).toBe(8);
  });

  it("falls back to available_bikes as string", () => {
    const item = createNearbyItem({ data: { available_bikes: "4" } });
    expect(getStationCount(item)).toBe(4);
  });

  it("returns null when no count fields exist", () => {
    const item = createNearbyItem({ data: {} });
    expect(getStationCount(item)).toBeNull();
  });

  it("returns null when count fields are non-numeric strings", () => {
    const item = createNearbyItem({ data: { num_available_vehicles: "abc" } });
    expect(getStationCount(item)).toBeNull();
  });

  it("prefers num_available_vehicles over num_vehicles", () => {
    const item = createNearbyItem({
      data: { num_available_vehicles: 2, num_vehicles: 10 },
    });
    expect(getStationCount(item)).toBe(2);
  });

  it("returns 0 when count is zero", () => {
    const item = createNearbyItem({ data: { num_available_vehicles: 0 } });
    expect(getStationCount(item)).toBe(0);
  });
});

// --- fetchNearbySearch ---

describe("fetchNearbySearch", () => {
  const baseParams: NearbySearchParams = {
    center: { lat: 51.3397, lon: 12.3731 },
    radius: 500,
  };

  const baseOptions = {
    baseUrl: "https://api.example.com/nearBySearch",
    apiKey: "test-key",
  };

  it("returns parsed item array on success", async () => {
    const items = [createNearbyItem(), createNearbyItem({ id: "nextbike-99999", name: "BIKE 99999" })];
    mockFetch(items);

    const result = await fetchNearbySearch(baseParams, undefined, baseOptions);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe("nextbike-12345");
      expect(result.data[1].id).toBe("nextbike-99999");
    }
  });

  it("uses X-API-Key header", async () => {
    mockFetch([]);
    await fetchNearbySearch(baseParams, undefined, baseOptions);

    const [, init] = getMockedFetch().mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ "X-API-Key": "test-key" });
  });

  it("builds URL with center and radius query parameters", async () => {
    mockFetch([]);
    await fetchNearbySearch(baseParams, undefined, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get("center")).toBe("51.3397,12.3731");
    expect(parsed.searchParams.get("radius")).toBe("500");
  });

  it("calls /search endpoint on base URL", async () => {
    mockFetch([]);
    await fetchNearbySearch(baseParams, undefined, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    expect((url as string).startsWith("https://api.example.com/nearBySearch/search?")).toBe(true);
  });

  it("appends types when provided", async () => {
    mockFetch([]);
    await fetchNearbySearch(
      { ...baseParams, types: ["station", "free_floating"] },
      undefined,
      baseOptions
    );

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("types")).toBe("station,free_floating");
  });

  it("appends vehicletypes when provided", async () => {
    mockFetch([]);
    await fetchNearbySearch(
      { ...baseParams, vehicleTypes: ["bike"] },
      undefined,
      baseOptions
    );

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("vehicletypes")).toBe("bike");
  });

  it("appends sources when provided", async () => {
    mockFetch([]);
    await fetchNearbySearch(
      { ...baseParams, sources: ["nextbike", "escooter"] },
      undefined,
      baseOptions
    );

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("sources")).toBe("nextbike,escooter");
  });

  it("appends provider when provided", async () => {
    mockFetch([]);
    await fetchNearbySearch(
      { ...baseParams, providers: ["nextbike Leipzig", "teilAuto"] },
      undefined,
      baseOptions
    );

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("provider")).toBe("nextbike Leipzig,teilAuto");
  });

  it("appends number (maxResults) when provided", async () => {
    mockFetch([]);
    await fetchNearbySearch(
      { ...baseParams, maxResults: 50 },
      undefined,
      baseOptions
    );

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("number")).toBe("50");
  });

  it("does not append optional params when not provided", async () => {
    mockFetch([]);
    await fetchNearbySearch(baseParams, undefined, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.has("types")).toBe(false);
    expect(parsed.searchParams.has("vehicletypes")).toBe(false);
    expect(parsed.searchParams.has("sources")).toBe(false);
    expect(parsed.searchParams.has("provider")).toBe(false);
    expect(parsed.searchParams.has("number")).toBe(false);
  });

  it("does not append empty arrays", async () => {
    mockFetch([]);
    await fetchNearbySearch(
      { ...baseParams, types: [], vehicleTypes: [], sources: [], providers: [] },
      undefined,
      baseOptions
    );

    const [url] = getMockedFetch().mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.has("types")).toBe(false);
    expect(parsed.searchParams.has("vehicletypes")).toBe(false);
    expect(parsed.searchParams.has("sources")).toBe(false);
    expect(parsed.searchParams.has("provider")).toBe(false);
  });

  it("returns api error on non-2xx response", async () => {
    mockFetch({ message: "Not found" }, false, 404);

    const result = await fetchNearbySearch(baseParams, undefined, baseOptions);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.status).toBe(404);
    }
  });

  it("returns api error on 500 response", async () => {
    mockFetch({ message: "Server error" }, false, 500);

    const result = await fetchNearbySearch(baseParams, undefined, baseOptions);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.status).toBe(500);
    }
  });

  it("returns parse error when response is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      })
    );

    const result = await fetchNearbySearch(baseParams, undefined, baseOptions);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("parse");
    }
  });

  it("returns network error on fetch rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const result = await fetchNearbySearch(baseParams, undefined, baseOptions);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("network");
      expect(result.error.message).toBe("Network failure");
    }
  });

  it("returns timeout error when request times out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            (init as RequestInit)?.signal?.addEventListener("abort", () => {
              const err = new Error("The operation was aborted.");
              err.name = "AbortError";
              reject(err);
            });
          })
      )
    );

    const resultPromise = fetchNearbySearch(baseParams, undefined, baseOptions);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("timeout");
    }
  });

  it("returns network error with 'Request cancelled' when external signal aborts", async () => {
    const externalController = new AbortController();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            const signal = (init as RequestInit)?.signal;
            signal?.addEventListener("abort", () => {
              const err = new Error("The operation was aborted.");
              err.name = "AbortError";
              reject(err);
            });
          })
      )
    );

    const resultPromise = fetchNearbySearch(baseParams, externalController.signal, baseOptions);
    // Abort externally after fetch has started
    externalController.abort();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("network");
      expect(result.error.message).toBe("Request cancelled");
    }
  });
});
