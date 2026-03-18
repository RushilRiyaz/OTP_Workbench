import { describe, it, expect } from "vitest";
import {
  computeTimelineRange,
  timeToY,
  durationToHeight,
  computeTotalHeight,
  generateHourMarkers,
  computeAlignedPositions,
  floorToMinute,
  DEFAULT_PIXELS_PER_MINUTE,
  CARD_HEIGHT,
  CARD_GAP,
  MIN_STRIP_HEIGHT,
  STRIP_GAP,
  TimelineConfig,
} from "../timelineUtils";
import type { RoutingResponse } from "@/lib/api/routing";
import { createItinerary, createRoutingResponse } from "@/test/fixtures";

// Helper to create a minimal comparison results entry
function makeEntry(itineraries: { startTime: number; endTime: number }[]): {
  result: RoutingResponse | null;
} {
  const fullItineraries = itineraries.map((it) =>
    createItinerary({
      startTime: it.startTime,
      endTime: it.endTime,
      duration: (it.endTime - it.startTime) / 1000,
    })
  );
  return {
    result: createRoutingResponse({ plan: { itineraries: fullItineraries, date: Date.now(), from: { name: "A", lon: 12, lat: 51 }, to: { name: "B", lon: 12, lat: 51 } } }),
  };
}

describe("computeTimelineRange", () => {
  it("returns a 1-hour fallback when no itineraries exist", () => {
    const result = computeTimelineRange({}, []);
    expect(result.end - result.start).toBe(3600000); // 1 hour
  });

  it("returns a 1-hour fallback when envIds have no results", () => {
    const result = computeTimelineRange(
      { prod: { result: null } },
      ["prod"]
    );
    expect(result.end - result.start).toBe(3600000);
  });

  it("computes range from a single environment with one itinerary", () => {
    // 12:30 to 13:00 Berlin time on 2025-01-15
    const startTime = new Date("2025-01-15T12:30:00+01:00").getTime();
    const endTime = new Date("2025-01-15T13:00:00+01:00").getTime();

    const results = { prod: makeEntry([{ startTime, endTime }]) };
    const range = computeTimelineRange(results, ["prod"], 15);

    // Should round down: 12:30 - 15min = 12:15 → floor to 12:00
    // Should round up: 13:00 + 15min = 13:15 → ceil to 14:00
    expect(range.start).toBeLessThanOrEqual(startTime);
    expect(range.end).toBeGreaterThanOrEqual(endTime);
    // Verify rounding to hour boundaries
    expect(new Date(range.start).getMinutes()).toBe(0);
    expect(new Date(range.start).getSeconds()).toBe(0);
  });

  it("computes range across multiple environments", () => {
    const startTime1 = new Date("2025-01-15T12:30:00+01:00").getTime();
    const endTime1 = new Date("2025-01-15T13:00:00+01:00").getTime();
    const startTime2 = new Date("2025-01-15T14:00:00+01:00").getTime();
    const endTime2 = new Date("2025-01-15T14:45:00+01:00").getTime();

    const results = {
      prod: makeEntry([{ startTime: startTime1, endTime: endTime1 }]),
      dev: makeEntry([{ startTime: startTime2, endTime: endTime2 }]),
    };

    const range = computeTimelineRange(results, ["prod", "dev"], 15);

    // Range should span from before startTime1 to after endTime2
    expect(range.start).toBeLessThanOrEqual(startTime1);
    expect(range.end).toBeGreaterThanOrEqual(endTime2);
  });

  it("ignores envIds not present in results", () => {
    const startTime = new Date("2025-01-15T12:30:00+01:00").getTime();
    const endTime = new Date("2025-01-15T13:00:00+01:00").getTime();

    const results = { prod: makeEntry([{ startTime, endTime }]) };
    const range = computeTimelineRange(results, ["prod", "missing"], 15);

    expect(range.start).toBeLessThanOrEqual(startTime);
    expect(range.end).toBeGreaterThanOrEqual(endTime);
  });

  it("uses custom padding", () => {
    const startTime = new Date("2025-01-15T12:30:00+01:00").getTime();
    const endTime = new Date("2025-01-15T13:00:00+01:00").getTime();

    const rangeNoPad = computeTimelineRange(
      { prod: makeEntry([{ startTime, endTime }]) },
      ["prod"],
      0
    );
    const rangeBigPad = computeTimelineRange(
      { prod: makeEntry([{ startTime, endTime }]) },
      ["prod"],
      60
    );

    // Bigger padding → wider range
    expect(rangeBigPad.end - rangeBigPad.start).toBeGreaterThanOrEqual(
      rangeNoPad.end - rangeNoPad.start
    );
  });
});

describe("timeToY", () => {
  const config: TimelineConfig = {
    timelineStart: 1000 * 60000, // arbitrary start in ms
    timelineEnd: 1120 * 60000,   // 2 hours later
    pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
  };

  it("returns 0 for the timeline start", () => {
    expect(timeToY(config.timelineStart, config)).toBe(0);
  });

  it("returns correct position for 30 minutes in", () => {
    const time = config.timelineStart + 30 * 60000;
    expect(timeToY(time, config)).toBe(30 * DEFAULT_PIXELS_PER_MINUTE);
  });

  it("returns full height for the timeline end", () => {
    const expected = 120 * DEFAULT_PIXELS_PER_MINUTE; // 120 minutes
    expect(timeToY(config.timelineEnd, config)).toBe(expected);
  });
});

describe("durationToHeight", () => {
  const config: TimelineConfig = {
    timelineStart: 0,
    timelineEnd: 3600000,
    pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
  };

  it("returns 0 for zero duration", () => {
    expect(durationToHeight(0, config)).toBe(0);
  });

  it("converts 30 minutes (1800s) correctly", () => {
    expect(durationToHeight(1800, config)).toBe(30 * DEFAULT_PIXELS_PER_MINUTE);
  });

  it("converts 1 hour (3600s) correctly", () => {
    expect(durationToHeight(3600, config)).toBe(60 * DEFAULT_PIXELS_PER_MINUTE);
  });
});

describe("computeTotalHeight", () => {
  it("computes height for a 2-hour timeline", () => {
    const config: TimelineConfig = {
      timelineStart: 0,
      timelineEnd: 2 * 3600000,
      pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
    };
    expect(computeTotalHeight(config)).toBe(120 * DEFAULT_PIXELS_PER_MINUTE);
  });

  it("computes height for a 30-minute timeline", () => {
    const config: TimelineConfig = {
      timelineStart: 0,
      timelineEnd: 30 * 60000,
      pixelsPerMinute: 4,
    };
    expect(computeTotalHeight(config)).toBe(30 * 4);
  });
});

describe("generateHourMarkers", () => {
  it("uses 30-min intervals for ranges <= 3 hours", () => {
    const config: TimelineConfig = {
      timelineStart: new Date("2025-01-15T12:00:00+01:00").getTime(),
      timelineEnd: new Date("2025-01-15T14:00:00+01:00").getTime(),
      pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
    };

    const markers = generateHourMarkers(config);

    // 12:00, 12:30, 13:00, 13:30, 14:00 = 5 markers
    expect(markers.length).toBe(5);
    expect(markers[0].y).toBe(0);
    expect(markers[1].y).toBe(30 * DEFAULT_PIXELS_PER_MINUTE);
  });

  it("uses 1-hour intervals for ranges > 3 hours", () => {
    const config: TimelineConfig = {
      timelineStart: new Date("2025-01-15T10:00:00+01:00").getTime(),
      timelineEnd: new Date("2025-01-15T16:00:00+01:00").getTime(),
      pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
    };

    const markers = generateHourMarkers(config);

    // 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00 = 7 markers
    expect(markers.length).toBe(7);
  });

  it("returns at least 1 marker", () => {
    const now = Date.now();
    const config: TimelineConfig = {
      timelineStart: now,
      timelineEnd: now,
      pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
    };

    const markers = generateHourMarkers(config);
    expect(markers.length).toBeGreaterThanOrEqual(1);
  });

  it("all markers have non-empty labels", () => {
    const config: TimelineConfig = {
      timelineStart: new Date("2025-01-15T12:00:00+01:00").getTime(),
      timelineEnd: new Date("2025-01-15T14:00:00+01:00").getTime(),
      pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
    };

    const markers = generateHourMarkers(config);
    for (const m of markers) {
      expect(m.label).toBeTruthy();
      expect(m.label).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// floorToMinute
// ---------------------------------------------------------------------------

describe("floorToMinute", () => {
  it("returns same value for exact minute", () => {
    const exact = 100 * 60000;
    expect(floorToMinute(exact)).toBe(exact);
  });

  it("floors 30 seconds to start of minute", () => {
    const base = 100 * 60000;
    expect(floorToMinute(base + 30000)).toBe(base);
  });

  it("floors 59.999s to start of minute", () => {
    const base = 100 * 60000;
    expect(floorToMinute(base + 59999)).toBe(base);
  });
});

// ---------------------------------------------------------------------------
// timeToY with sub-minute precision
// ---------------------------------------------------------------------------

describe("timeToY sub-minute flooring", () => {
  const config: TimelineConfig = {
    timelineStart: 1000 * 60000,
    timelineEnd: 1120 * 60000,
    pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
  };

  it("two times 30s apart in same minute produce the same Y", () => {
    const t1 = config.timelineStart + 30 * 60000;          // exactly :30
    const t2 = config.timelineStart + 30 * 60000 + 30000;  // :30:30
    expect(timeToY(t1, config)).toBe(timeToY(t2, config));
  });

  it("times in different minutes produce different Y", () => {
    const t1 = config.timelineStart + 30 * 60000;  // :30
    const t2 = config.timelineStart + 31 * 60000;  // :31
    expect(timeToY(t2, config)).toBeGreaterThan(timeToY(t1, config));
  });
});

// ---------------------------------------------------------------------------
// computeAlignedPositions
// ---------------------------------------------------------------------------

describe("computeAlignedPositions", () => {
  const MIN = 60000;
  // Use a clean minute-aligned start
  const T0 = 2000 * MIN;
  const config: TimelineConfig = {
    timelineStart: T0 - 60 * MIN,
    timelineEnd: T0 + 180 * MIN,
    pixelsPerMinute: DEFAULT_PIXELS_PER_MINUTE,
  };

  it("aligns same-time cards across two columns", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [{ startTime: T0, duration: 1800 }] },
        { envId: "b", itineraries: [{ startTime: T0, duration: 2400 }] },
      ],
      config,
      "horizontal",
    );
    expect(pos["a"][0].y).toBe(pos["b"][0].y);
  });

  it("aligns cards when overlap prevention pushes one column down (core bug)", () => {
    // Column A: cards at T0 and T0+10min (10min gap = 80px < 88px card+gap → pushed)
    // Column B: card at T0+10min only (no push needed)
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [
          { startTime: T0, duration: 1800 },
          { startTime: T0 + 10 * MIN, duration: 1800 },
        ]},
        { envId: "b", itineraries: [
          { startTime: T0 + 10 * MIN, duration: 1800 },
        ]},
      ],
      config,
      "horizontal",
    );
    // The T0+10min cards must be at the same Y
    expect(pos["a"][1].y).toBe(pos["b"][0].y);
    // Column A's second card should be pushed past first card
    expect(pos["a"][1].y).toBe(pos["a"][0].y + CARD_HEIGHT + CARD_GAP);
  });

  it("groups sub-minute differences to same Y", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [{ startTime: T0 + 5000, duration: 1800 }] },
        { envId: "b", itineraries: [{ startTime: T0 + 45000, duration: 1800 }] },
      ],
      config,
      "horizontal",
    );
    expect(pos["a"][0].y).toBe(pos["b"][0].y);
  });

  it("separates cards in different minutes", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [{ startTime: T0, duration: 1800 }] },
        { envId: "b", itineraries: [{ startTime: T0 + MIN, duration: 1800 }] },
      ],
      config,
      "horizontal",
    );
    expect(pos["b"][0].y).toBeGreaterThan(pos["a"][0].y);
  });

  it("stacks multiple same-minute cards in the same column", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [
          { startTime: T0, duration: 1800 },
          { startTime: T0 + 10000, duration: 1800 }, // same minute
        ]},
        { envId: "b", itineraries: [
          { startTime: T0, duration: 1800 },
        ]},
      ],
      config,
      "horizontal",
    );
    // First cards aligned
    expect(pos["a"][0].y).toBe(pos["b"][0].y);
    // Second card in A stacked below first
    expect(pos["a"][1].y).toBe(pos["a"][0].y + CARD_HEIGHT + CARD_GAP);
  });

  it("handles empty column", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [{ startTime: T0, duration: 1800 }] },
        { envId: "b", itineraries: [] },
      ],
      config,
      "horizontal",
    );
    expect(pos["a"]).toHaveLength(1);
    expect(pos["b"]).toHaveLength(0);
  });

  it("single column matches per-column behavior", () => {
    const pos = computeAlignedPositions(
      [{ envId: "a", itineraries: [
        { startTime: T0, duration: 1800 },
        { startTime: T0 + 5 * MIN, duration: 1800 },
        { startTime: T0 + 30 * MIN, duration: 1800 },
      ]}],
      config,
      "horizontal",
    );
    // First card at natural position
    const y0 = timeToY(T0, config);
    expect(pos["a"][0].y).toBe(y0);
    // Second card: 5min gap = 40px < 88px, so pushed
    expect(pos["a"][1].y).toBe(y0 + CARD_HEIGHT + CARD_GAP);
    // Third card: 30min gap = 240px >> 88px, so at natural position
    expect(pos["a"][2].y).toBe(timeToY(T0 + 30 * MIN, config));
  });

  it("uses duration-based heights in vertical mode", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [{ startTime: T0, duration: 1800 }] },  // 30min → 240px
        { envId: "b", itineraries: [{ startTime: T0, duration: 300 }] },   // 5min → 40px < MIN_STRIP_HEIGHT
      ],
      config,
      "vertical",
    );
    expect(pos["a"][0].y).toBe(pos["b"][0].y);
    expect(pos["a"][0].height).toBe(durationToHeight(1800, config)); // 240
    expect(pos["b"][0].height).toBe(MIN_STRIP_HEIGHT); // clamped to 60
  });

  it("cascade: push-down in group N propagates to group N+1", () => {
    // Column A: 3 cards at T0, T0+1min, T0+2min (each pushed by overlap)
    // Column B: 1 card at T0+2min only
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [
          { startTime: T0, duration: 1800 },
          { startTime: T0 + MIN, duration: 1800 },
          { startTime: T0 + 2 * MIN, duration: 1800 },
        ]},
        { envId: "b", itineraries: [
          { startTime: T0 + 2 * MIN, duration: 1800 },
        ]},
      ],
      config,
      "horizontal",
    );
    // A's cards cascade: each pushed by CARD_HEIGHT + CARD_GAP
    const y0 = timeToY(T0, config);
    expect(pos["a"][0].y).toBe(y0);
    expect(pos["a"][1].y).toBe(y0 + CARD_HEIGHT + CARD_GAP);
    expect(pos["a"][2].y).toBe(y0 + 2 * (CARD_HEIGHT + CARD_GAP));
    // B's card at T0+2min aligns with A's third card
    expect(pos["b"][0].y).toBe(pos["a"][2].y);
  });

  it("non-overlapping cards use natural positions", () => {
    const pos = computeAlignedPositions(
      [
        { envId: "a", itineraries: [{ startTime: T0, duration: 1800 }] },
        { envId: "b", itineraries: [{ startTime: T0 + 60 * MIN, duration: 1800 }] },
      ],
      config,
      "horizontal",
    );
    expect(pos["a"][0].y).toBe(timeToY(T0, config));
    expect(pos["b"][0].y).toBe(timeToY(T0 + 60 * MIN, config));
  });
});
