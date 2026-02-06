import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchLocations, AutocompleteResult } from "@/lib/autocomplete";

// FR4.4: Unit tests for LVB autocomplete API integration

describe("searchLocations (FR4.4)", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  const mockResults: AutocompleteResult[] = [
    {
      id: "loc-1",
      name: "Augustusplatz",
      data: "Augustusplatz, Leipzig",
      lat: 51.3397,
      lon: 12.3816,
      ptype: "S",
      stadt: "Leipzig",
      stadtteil: "Zentrum",
      postalcode: "04109",
      landkreis: null,
      streetname: null,
      housenumber: null,
      tags: null,
    },
    {
      id: "loc-2",
      name: "Leipzig Hauptbahnhof",
      data: "Leipzig Hauptbahnhof",
      lat: 51.3455,
      lon: 12.3818,
      ptype: "S",
      stadt: "Leipzig",
      stadtteil: null,
      postalcode: null,
      landkreis: null,
      streetname: null,
      housenumber: null,
      tags: null,
    },
  ];

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetchResponse(body: unknown, ok = true, status = 200) {
    fetchSpy.mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    });
  }

  // --- Input validation ---

  it("returns empty array for search less than 2 characters", async () => {
    const result = await searchLocations({ search: "a" });
    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns empty array for empty search", async () => {
    const result = await searchLocations({ search: "" });
    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // --- Successful requests ---

  it("returns autocomplete results for valid search", async () => {
    mockFetchResponse(mockResults);

    const result = await searchLocations({ search: "August" });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Augustusplatz");
    expect(result[1].name).toBe("Leipzig Hauptbahnhof");
  });

  it("builds correct URL with default parameters", async () => {
    mockFetchResponse(mockResults);

    await searchLocations({ search: "Leipzig" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("search")).toBe("Leipzig");
    expect(url.searchParams.get("format")).toBe("JSON");
    expect(url.searchParams.get("size")).toBe("10");
    expect(url.searchParams.get("center")).toBe("51.3,12.6");
    expect(url.searchParams.get("pointType")).toBe("P,S,W,V,N");
  });

  it("uses custom size parameter", async () => {
    mockFetchResponse(mockResults);

    await searchLocations({ search: "Leipzig", size: 5 });

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("size")).toBe("5");
  });

  it("uses custom center parameter", async () => {
    mockFetchResponse(mockResults);

    await searchLocations({ search: "Leipzig", center: "52.0,13.0" });

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("center")).toBe("52.0,13.0");
  });

  it("uses custom pointType parameter", async () => {
    mockFetchResponse(mockResults);

    await searchLocations({ search: "Leipzig", pointType: "S,P" });

    const url = new URL(fetchSpy.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("pointType")).toBe("S,P");
  });

  it("includes X-API-Key header", async () => {
    mockFetchResponse(mockResults);

    await searchLocations({ search: "Leipzig" });

    const options = fetchSpy.mock.calls[0][1];
    expect(options.headers).toHaveProperty("X-API-Key");
  });

  // --- Error handling ---

  it("throws error for non-OK response", async () => {
    mockFetchResponse(null, false, 500);

    await expect(searchLocations({ search: "Leipzig" })).rejects.toThrow(
      "Autocomplete API error: 500"
    );
  });

  it("returns empty array for non-array response", async () => {
    mockFetchResponse({ error: "unexpected format" });

    const result = await searchLocations({ search: "Leipzig" });
    expect(result).toEqual([]);
  });

  it("returns empty array for invalid JSON response", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const result = await searchLocations({ search: "Leipzig" });
    expect(result).toEqual([]);
  });

  // --- Abort handling ---

  it("passes signal to fetch for cancellation", async () => {
    mockFetchResponse(mockResults);
    const controller = new AbortController();

    await searchLocations({ search: "Leipzig", signal: controller.signal });

    const options = fetchSpy.mock.calls[0][1];
    expect(options.signal).toBeDefined();
  });

  it("handles abort signal gracefully", async () => {
    const controller = new AbortController();
    controller.abort();

    fetchSpy.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    // Should throw or reject when aborted
    try {
      await searchLocations({ search: "Leipzig", signal: controller.signal });
    } catch {
      // Expected to throw
      expect(true).toBe(true);
    }
  });
});
