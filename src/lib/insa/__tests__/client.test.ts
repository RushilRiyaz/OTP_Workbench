import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchInsaRouting } from "../client";
import type { RoutingRequestParams } from "@/lib/api/routing";
import { coordsLocation, stopIdLocation, autocompleteLocation, defaultOptions } from "@/test/fixtures";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(body),
  }));
}

function getMockedFetch() {
  return vi.mocked(fetch);
}

function makeParams(overrides?: Partial<RoutingRequestParams>): RoutingRequestParams {
  return {
    start: coordsLocation(51.34, 12.37),
    destination: coordsLocation(51.30, 12.40),
    dateTime: "2026-03-18T10:00",
    routingOptions: defaultOptions(),
    ...overrides,
  };
}

function insaSuccessResponse() {
  return {
    Trip: [{
      Origin: { name: "A", type: "ST", id: "1", extId: "1", lon: 12.37, lat: 51.34, time: "10:00:00", date: "2026-03-18", tz: 60 },
      Destination: { name: "B", type: "ST", id: "2", extId: "2", lon: 12.4, lat: 51.3, time: "10:30:00", date: "2026-03-18", tz: 60 },
      LegList: { Leg: [{
        Origin: { name: "A", type: "ST", id: "1", extId: "1", lon: 12.37, lat: 51.34, time: "10:00:00", date: "2026-03-18", tz: 60 },
        Destination: { name: "B", type: "ST", id: "2", extId: "2", lon: 12.4, lat: 51.3, time: "10:30:00", date: "2026-03-18", tz: 60 },
        type: "JNY", duration: "PT30M", id: "C-0:000", idx: 0,
        Product: [{ name: "Bus 100", catOut: "Bus", catCode: "6", cls: "64" }],
      }] },
      duration: "PT30M", tripId: "C-0", idx: 0,
    }],
    scrB: "back-token",
    scrF: "forward-token",
  };
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("fetchInsaRouting", () => {
  // --- Input validation ---

  it("returns api error when origin is a bare stop ID", async () => {
    mockFetch(insaSuccessResponse());
    const result = await fetchInsaRouting(makeParams({ start: stopIdLocation("12345") }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.message).toContain("origin");
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns api error when destination is a bare stop ID", async () => {
    mockFetch(insaSuccessResponse());
    const result = await fetchInsaRouting(makeParams({ destination: stopIdLocation("67890") }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.message).toContain("destination");
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  // --- Success paths ---

  it("returns success with OTP-formatted data for coordinate params", async () => {
    mockFetch(insaSuccessResponse());
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.plan?.itineraries).toHaveLength(1);
    expect(result.data.RetStatus.Value).toBe("OK");
  });

  it("extracts coordinates from autocomplete locations", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams({
      start: autocompleteLocation("loc-1", "Hbf", 51.34, 12.37),
      destination: autocompleteLocation("loc-2", "Markt", 51.30, 12.40),
    }));
    const [url] = getMockedFetch().mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get("originCoordLat")).toBe("51.34");
    expect(parsed.searchParams.get("originCoordLong")).toBe("12.37");
    expect(parsed.searchParams.get("originCoordName")).toBe("Hbf");
  });

  // --- HTTP errors ---

  it("returns api error with status on 404", async () => {
    mockFetch({ error: "Not found" }, false, 404);
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.status).toBe(404);
    }
  });

  it("returns api error with status on 500", async () => {
    mockFetch({ error: "Server error" }, false, 500);
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.status).toBe(500);
    }
  });

  // --- JSON parse error ---

  it("returns parse error when response is not valid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    }));
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.type).toBe("parse");
  });

  // --- INSA error response ---

  it("returns api error when response contains errorText", async () => {
    mockFetch({ errorCode: "SVC_LOC", errorText: "Origin not found" });
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.message).toBe("Origin not found");
    }
  });

  it("returns api error with errorCode when errorText absent", async () => {
    mockFetch({ errorCode: "SVC_LOC_ARR" });
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain("SVC_LOC_ARR");
  });

  // --- Empty / missing trips ---

  it("returns api error when Trip array is empty", async () => {
    mockFetch({ Trip: [] });
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain("no trips");
  });

  it("returns api error when Trip field is undefined", async () => {
    mockFetch({ scrB: "x", scrF: "y" });
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain("no trips");
  });

  // --- Timeout ---

  it("returns timeout error after 30s", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) => new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      })
    ));
    const resultPromise = fetchInsaRouting(makeParams());
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("timeout");
      expect(result.error.message).toContain("30");
    }
  });

  // --- External abort ---

  it("returns network error when externally aborted", async () => {
    const ac = new AbortController();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(
      (_url: string, init?: RequestInit) => new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      })
    ));
    const resultPromise = fetchInsaRouting(makeParams(), ac.signal);
    ac.abort();
    const result = await resultPromise;
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("network");
      expect(result.error.message).toContain("cancelled");
    }
  });

  // --- Context pagination ---

  it("adds context param to URL when provided", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams(), undefined, { context: "forward-token-123" });
    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("context")).toBe("forward-token-123");
  });

  it("omits context param when not provided", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams());
    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.has("context")).toBe(false);
  });

  // --- Arrive-by ---

  it("sets searchForArrival=1 when arriveBy", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams({ routingOptions: defaultOptions({ timingMode: "arriveBy" }) }));
    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("searchForArrival")).toBe("1");
  });

  it("does not set searchForArrival when departAt", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams());
    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.has("searchForArrival")).toBe(false);
  });

  // --- Travel modes → products ---

  it("maps BUS to products=64", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams({ routingOptions: defaultOptions({ travelModes: ["BUS"] }) }));
    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("products")).toBe("64");
  });

  it("combines BUS+TRAM to products=96", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams({ routingOptions: defaultOptions({ travelModes: ["BUS", "TRAM"] }) }));
    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("products")).toBe("96");
  });

  // --- URL construction ---

  it("sets correct date and time params", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams({ dateTime: "2026-03-18T14:30" }));
    const parsed = new URL(getMockedFetch().mock.calls[0][0] as string);
    expect(parsed.searchParams.get("date")).toBe("2026-03-18");
    expect(parsed.searchParams.get("time")).toBe("14:30");
  });

  it("includes standard fixed params", async () => {
    mockFetch(insaSuccessResponse());
    await fetchInsaRouting(makeParams());
    const parsed = new URL(getMockedFetch().mock.calls[0][0] as string);
    expect(parsed.searchParams.get("format")).toBe("json");
    expect(parsed.searchParams.get("passlist")).toBe("1");
    expect(parsed.searchParams.get("poly")).toBe("1");
    expect(parsed.searchParams.get("polyEnc")).toBe("GPA");
    expect(parsed.searchParams.get("tariff")).toBe("false");
  });

  // --- Raw response ---

  it("attaches _rawApiResponse with scroll tokens", async () => {
    mockFetch(insaSuccessResponse());
    const result = await fetchInsaRouting(makeParams());
    if (!result.success) return;
    const raw = result.data._rawApiResponse as Record<string, unknown>;
    expect(raw.scrB).toBe("back-token");
    expect(raw.scrF).toBe("forward-token");
  });

  // --- Network error ---

  it("returns network error for generic fetch rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const result = await fetchInsaRouting(makeParams());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("network");
      expect(result.error.message).toBe("Failed to fetch");
    }
  });
});
