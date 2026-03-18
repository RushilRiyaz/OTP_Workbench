import { describe, it, expect } from "vitest";
import {
  formatTimestamp,
  formatDuration,
  formatDelay,
  getLegColor,
  getUniqueProducts,
  formatDistance,
  formatAlertCategory,
  MODE_COLORS,
} from "@/lib/utils/legUtils";
import { createTransitLeg, createNonTransitLeg } from "@/test/fixtures";

describe("formatTimestamp", () => {
  it("formats epoch ms to HH:mm in Europe/Berlin", () => {
    // 2026-02-03T14:30:00 CET = epoch 1738588200000
    const result = formatTimestamp(1738588200000);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("returns correct Berlin time for known UTC epoch (CET)", () => {
    // 2026-02-03T14:30:00 CET (UTC+1) = 2026-02-03T13:30:00 UTC = 1770125400000
    expect(formatTimestamp(1770125400000)).toBe("14:30");
  });

  it("returns correct Berlin time for known UTC epoch (CEST)", () => {
    // 2026-07-15T12:00:00 CEST (UTC+2) = 2026-07-15T10:00:00 UTC = 1752573600000
    expect(formatTimestamp(1752573600000)).toBe("12:00");
  });

  it("handles midnight Berlin time", () => {
    // 2026-02-03T00:00:00 CET = 2026-02-02T23:00:00 UTC = 1738537200000
    expect(formatTimestamp(1738537200000)).toBe("00:00");
  });

  it("handles 23:59 Berlin time", () => {
    // 2026-02-03T23:59:00 CET = 2026-02-03T22:59:00 UTC = 1738623540000
    expect(formatTimestamp(1738623540000)).toBe("23:59");
  });
});

describe("formatDuration", () => {
  it("formats seconds under 60 min as Xmin", () => {
    expect(formatDuration(300)).toBe("5 min");
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(59 * 60)).toBe("59 min");
  });

  it("formats 60+ min as Xh Ymin", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(5400)).toBe("1h 30min");
    expect(formatDuration(7200)).toBe("2h");
  });

  it("rounds to nearest minute", () => {
    // 89s → 1 min (round), 91s → 2 min (round)
    expect(formatDuration(89)).toBe("1 min");
    expect(formatDuration(91)).toBe("2 min");
  });

  it("handles multi-hour durations", () => {
    // 3h 45min = 13500s
    expect(formatDuration(13500)).toBe("3h 45min");
    // 10h = 36000s
    expect(formatDuration(36000)).toBe("10h");
  });

  it("handles exactly 59 seconds (rounds to 1 min)", () => {
    expect(formatDuration(59)).toBe("1 min");
  });

  it("handles 29 seconds (rounds to 0 min)", () => {
    expect(formatDuration(29)).toBe("0 min");
  });
});

describe("formatDelay", () => {
  it("returns null for no delay", () => {
    expect(formatDelay(undefined)).toBeNull();
    expect(formatDelay(0)).toBeNull();
  });

  it("returns null for delays under 30s (rounds to 0 min)", () => {
    expect(formatDelay(20)).toBeNull();
    expect(formatDelay(29)).toBeNull();
    expect(formatDelay(-29)).toBeNull();
  });

  it("returns +N for positive delays", () => {
    expect(formatDelay(120)).toBe("+2");
    expect(formatDelay(300)).toBe("+5");
  });

  it("returns -N for negative delays (early)", () => {
    expect(formatDelay(-120)).toBe("-2");
  });

  it("rounds 30s to +1 (JS Math.round: -30s rounds to -0 = null)", () => {
    expect(formatDelay(30)).toBe("+1");
    // Math.round(-0.5) = -0 which === 0, so returns null
    expect(formatDelay(-30)).toBeNull();
  });

  it("rounds 90s: +90→+2, -90→-1 (JS Math.round rounds half toward +∞)", () => {
    expect(formatDelay(90)).toBe("+2");
    // Math.round(-1.5) = -1, not -2
    expect(formatDelay(-90)).toBe("-1");
  });

  it("handles large delays", () => {
    expect(formatDelay(3600)).toBe("+60");
    expect(formatDelay(-1800)).toBe("-30");
  });
});

describe("getLegColor", () => {
  it("returns routeColor for transit legs with valid color", () => {
    const leg = createTransitLeg({ routeColor: "FFD800" });
    expect(getLegColor(leg)).toBe("#FFD800");
  });

  it("returns routeColor with # prefix as-is", () => {
    const leg = createTransitLeg({ routeColor: "#E3000F" });
    expect(getLegColor(leg)).toBe("#E3000F");
  });

  it("falls back to mode color", () => {
    const leg = createTransitLeg({ routeColor: "", mode: "BUS" });
    expect(getLegColor(leg)).toBe(MODE_COLORS.BUS);
  });

  it("returns walk mode color for non-transit legs", () => {
    const leg = createNonTransitLeg({ mode: "WALK" });
    expect(getLegColor(leg)).toBe(MODE_COLORS.WALK);
  });

  it("returns default blue for unknown mode", () => {
    const leg = createNonTransitLeg({ mode: "UNKNOWN" as "WALK" });
    expect(getLegColor(leg)).toBe("#3b82f6");
  });

  it("falls back to mode color for short routeColor (<4 chars after #)", () => {
    // "#AB" = length 3, too short → fallback
    const leg = createTransitLeg({ routeColor: "AB", mode: "TRAM" });
    expect(getLegColor(leg)).toBe(MODE_COLORS.TRAM);
  });

  it("accepts 4-char color codes (shorthand hex)", () => {
    const leg = createTransitLeg({ routeColor: "#FFF" });
    expect(getLegColor(leg)).toBe("#FFF");
  });

  it("returns mode color for all known transit modes", () => {
    for (const mode of ["BUS", "TRAM", "SUBURB", "TRAIN", "SUBWAY", "FERRY", "FLEXA"] as const) {
      const leg = createTransitLeg({ routeColor: "", mode });
      expect(getLegColor(leg)).toBe(MODE_COLORS[mode]);
    }
  });
});

describe("getUniqueProducts", () => {
  it("returns unique transit products", () => {
    const legs = [
      createNonTransitLeg(),
      createTransitLeg({ mode: "TRAM", routeShortName: "15" }),
      createTransitLeg({ mode: "TRAM", routeShortName: "15" }),
      createTransitLeg({ mode: "BUS", routeShortName: "89" }),
    ];
    const products = getUniqueProducts(legs);
    expect(products).toHaveLength(2);
    expect(products[0].mode).toBe("TRAM");
    expect(products[0].routeName).toBe("15");
    expect(products[1].mode).toBe("BUS");
    expect(products[1].routeName).toBe("89");
  });

  it("skips non-transit legs", () => {
    const products = getUniqueProducts([createNonTransitLeg()]);
    expect(products).toHaveLength(0);
  });

  it("returns empty array for empty legs", () => {
    expect(getUniqueProducts([])).toHaveLength(0);
  });

  it("keeps same mode with different route names as separate products", () => {
    const legs = [
      createTransitLeg({ mode: "TRAM", routeShortName: "15" }),
      createTransitLeg({ mode: "TRAM", routeShortName: "11" }),
    ];
    const products = getUniqueProducts(legs);
    expect(products).toHaveLength(2);
    expect(products[0].routeName).toBe("15");
    expect(products[1].routeName).toBe("11");
  });

  it("includes color from getLegColor for each product", () => {
    const legs = [
      createTransitLeg({ mode: "BUS", routeShortName: "89", routeColor: "FF0000" }),
    ];
    const products = getUniqueProducts(legs);
    expect(products[0].color).toBe("#FF0000");
  });

  it("uses MODE_LABELS for known modes, falls back to mode string", () => {
    const legs = [
      createTransitLeg({ mode: "TRAM", routeShortName: "1" }),
      createTransitLeg({ mode: "GONDOLA" as "TRAM", routeShortName: "G1" }),
    ];
    const products = getUniqueProducts(legs);
    expect(products[0].label).toBe("Tram");
    expect(products[1].label).toBe("GONDOLA");
  });
});

describe("formatDistance", () => {
  it("formats meters under 1000", () => {
    expect(formatDistance(350)).toBe("350 m");
    expect(formatDistance(0)).toBe("0 m");
  });

  it("formats 1000+ meters as km", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(2500)).toBe("2.5 km");
  });

  it("formats 999m as meters (boundary)", () => {
    expect(formatDistance(999)).toBe("999 m");
  });

  it("formats large distances", () => {
    expect(formatDistance(15750)).toBe("15.8 km");
    expect(formatDistance(100000)).toBe("100.0 km");
  });

  it("rounds meters to nearest integer", () => {
    expect(formatDistance(350.7)).toBe("351 m");
  });
});

describe("formatAlertCategory", () => {
  it("returns known category labels", () => {
    expect(formatAlertCategory(0)).toBe("Disruption");
    expect(formatAlertCategory(1)).toBe("Delay");
    expect(formatAlertCategory(2)).toBe("Winter");
    expect(formatAlertCategory(3)).toBe("Info");
    expect(formatAlertCategory(4)).toBe("Construction");
    expect(formatAlertCategory(5)).toBe("Event");
    expect(formatAlertCategory(6)).toBe("Unreachable");
  });

  it("returns Unknown for invalid category", () => {
    expect(formatAlertCategory(99)).toBe("Unknown");
    expect(formatAlertCategory(-1)).toBe("Unknown");
    expect(formatAlertCategory(7)).toBe("Unknown");
  });
});
