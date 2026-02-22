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

  it("handles DST spring-forward boundary (CET → CEST)", () => {
    // 2026-03-29 is last Sunday of March
    // At 2026-03-29T01:00:00Z (= 02:00 CET) clocks jump to 03:00 CEST
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-29T01:00:00Z"));

    const result = getBerlinNow();
    expect(result).toBe("2026-03-29T03:00");
  });

  it("handles DST fall-back boundary (CEST → CET)", () => {
    // 2026-10-25 is last Sunday of October
    // At 2026-10-25T01:00:00Z (= 03:00 CEST) clocks fall back to 02:00 CET
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T01:00:00Z"));

    const result = getBerlinNow();
    expect(result).toBe("2026-10-25T02:00");
  });

  it("handles midnight Berlin time", () => {
    // Midnight Berlin CET = 23:00 UTC previous day
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-02T23:00:00Z"));

    const result = getBerlinNow();
    expect(result).toBe("2026-02-03T00:00");
  });

  it("handles New Year boundary", () => {
    // 2026-12-31T23:30:00 CET = 2026-12-31T22:30:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T22:30:00Z"));

    const result = getBerlinNow();
    expect(result).toBe("2026-12-31T23:30");
  });

  it("output never includes seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T14:30:45Z"));

    const result = getBerlinNow();
    // Must be exactly YYYY-MM-DDTHH:mm — no seconds
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(result).not.toContain(":45");
  });
});
