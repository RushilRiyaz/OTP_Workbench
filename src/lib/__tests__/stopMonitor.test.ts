// NFR-SM6.1: Unit tests for stopMonitor.ts API client

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchStopMonitor,
  formatDateForMonitor,
  formatTimeForMonitor,
} from "@/lib/stopMonitor";
import { createMonitorItem } from "@/test/fixtures";

// --- Helper ---

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

// --- formatDateForMonitor ---

describe("formatDateForMonitor", () => {
  it("converts datetime-local to YYYYMMDD", () => {
    expect(formatDateForMonitor("2026-03-07T14:30")).toBe("20260307");
  });

  it("handles single-digit months and days", () => {
    expect(formatDateForMonitor("2026-01-05T09:00")).toBe("20260105");
  });
});

// --- formatTimeForMonitor ---

describe("formatTimeForMonitor", () => {
  it("extracts HH:MM from datetime-local string", () => {
    expect(formatTimeForMonitor("2026-03-07T14:30")).toBe("14:30");
  });

  it("handles midnight", () => {
    expect(formatTimeForMonitor("2026-03-07T00:00")).toBe("00:00");
  });
});

// --- fetchStopMonitor ---

describe("fetchStopMonitor", () => {
  const baseParams = {
    stopId: "0013000_parent",
    date: "20260307",
    time: "14:30",
  };

  const baseOptions = {
    baseUrl: "https://api.example.com/stopMonitor",
    apiKey: "test-key",
  };

  it("returns parsed MonitorItem array on success", async () => {
    const items = [createMonitorItem(), createMonitorItem({ line: "15" })];
    mockFetch(items);

    const result = await fetchStopMonitor(baseParams, baseOptions);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].line).toBe("11");
      expect(result.data[1].line).toBe("15");
    }
  });

  it("uses X-API-Key header", async () => {
    mockFetch([]);
    await fetchStopMonitor(baseParams, baseOptions);

    const [, init] = getMockedFetch().mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ "X-API-Key": "test-key" });
  });

  it("builds URL with required query parameters", async () => {
    mockFetch([]);
    await fetchStopMonitor(baseParams, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get("stopid")).toBe("0013000_parent");
    expect(parsed.searchParams.get("date")).toBe("20260307");
    expect(parsed.searchParams.get("time")).toBe("14:30");
    expect(parsed.searchParams.get("minutes")).toBe("60");
  });

  it("uses custom minutes value", async () => {
    mockFetch([]);
    await fetchStopMonitor({ ...baseParams, minutes: 120 }, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("minutes")).toBe("120");
  });

  it("appends arrOnly=true when set", async () => {
    mockFetch([]);
    await fetchStopMonitor({ ...baseParams, arrOnly: true }, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("arrOnly")).toBe("true");
  });

  it("appends depOnly=true when set", async () => {
    mockFetch([]);
    await fetchStopMonitor({ ...baseParams, depOnly: true }, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    expect(new URL(url as string).searchParams.get("depOnly")).toBe("true");
  });

  it("does not append arrOnly/depOnly when not set", async () => {
    mockFetch([]);
    await fetchStopMonitor(baseParams, baseOptions);

    const [url] = getMockedFetch().mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.searchParams.has("arrOnly")).toBe(false);
    expect(parsed.searchParams.has("depOnly")).toBe(false);
  });

  it("returns api error on non-2xx response", async () => {
    mockFetch({ message: "Not found" }, false, 404);

    const result = await fetchStopMonitor(baseParams, baseOptions);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("api");
      expect(result.error.status).toBe(404);
    }
  });

  it("returns api error on 500 response", async () => {
    mockFetch({ message: "Server error" }, false, 500);

    const result = await fetchStopMonitor(baseParams, baseOptions);

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

    const result = await fetchStopMonitor(baseParams, baseOptions);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("parse");
    }
  });

  it("returns network error on fetch rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const result = await fetchStopMonitor(baseParams, baseOptions);

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
            // Reject when the AbortController fires (simulates a hung request)
            (init as RequestInit)?.signal?.addEventListener("abort", () => {
              const err = new Error("The operation was aborted.");
              err.name = "AbortError";
              reject(err);
            });
          })
      )
    );

    const resultPromise = fetchStopMonitor(baseParams, baseOptions);
    // Advance past the 30s internal timeout, then flush microtasks
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("timeout");
    }
  });

  it("supports parallel multi-environment calls independently", async () => {
    const items1 = [createMonitorItem({ line: "11" })];
    const items2 = [createMonitorItem({ line: "15" }), createMonitorItem({ line: "16" })];

    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(items1),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(items2),
        })
    );

    const [result1, result2] = await Promise.all([
      fetchStopMonitor(baseParams, { baseUrl: "https://prod.example.com/stopMonitor", apiKey: "prod-key" }),
      fetchStopMonitor(baseParams, { baseUrl: "https://stage.example.com/stopMonitor", apiKey: "stage-key" }),
    ]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (result1.success) expect(result1.data[0].line).toBe("11");
    if (result2.success) expect(result2.data).toHaveLength(2);
  });
});
