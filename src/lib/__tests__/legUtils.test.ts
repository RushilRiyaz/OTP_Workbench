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
} from "@/lib/legUtils";
import { createTransitLeg, createNonTransitLeg } from "@/test/fixtures";

describe("formatTimestamp", () => {
  it("formats epoch ms to HH:mm in Europe/Berlin", () => {
    // 2026-02-03T14:30:00 CET = epoch 1738588200000
    const result = formatTimestamp(1738588200000);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
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
});

describe("formatDelay", () => {
  it("returns null for no delay", () => {
    expect(formatDelay(undefined)).toBeNull();
    expect(formatDelay(0)).toBeNull();
  });

  it("returns null for delays under 30s (rounds to 0 min)", () => {
    expect(formatDelay(20)).toBeNull();
  });

  it("returns +N for positive delays", () => {
    expect(formatDelay(120)).toBe("+2");
    expect(formatDelay(300)).toBe("+5");
  });

  it("returns -N for negative delays (early)", () => {
    expect(formatDelay(-120)).toBe("-2");
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
  });
});
