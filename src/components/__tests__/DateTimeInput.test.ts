import { describe, it, expect, vi, afterEach } from "vitest";
import { getBerlinNow } from "@/components/DateTimeInput";

describe("getBerlinNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a datetime-local formatted string (YYYY-MM-DDTHH:mm)", () => {
    const result = getBerlinNow();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("returns Berlin-timezone time for a known UTC instant", () => {
    // 2026-07-15 10:00:00 UTC = 2026-07-15 12:00 Berlin (CEST, UTC+2)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));

    const result = getBerlinNow();
    expect(result).toBe("2026-07-15T12:00");
  });

  it("handles CET (winter) correctly", () => {
    // 2026-01-10 10:00:00 UTC = 2026-01-10 11:00 Berlin (CET, UTC+1)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T10:00:00Z"));

    const result = getBerlinNow();
    expect(result).toBe("2026-01-10T11:00");
  });
});
