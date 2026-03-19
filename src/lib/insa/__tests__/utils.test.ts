import { describe, it, expect } from "vitest";
import {
  parseInsaDateTime,
  parseIsoDuration,
  formatTimeHHMM,
  formatDurationHHMM,
  travelModesToProducts,
  insaCategoryToOtpMode,
  decodeGooglePolyline,
} from "../utils";

// ---------------------------------------------------------------------------
// parseInsaDateTime
// ---------------------------------------------------------------------------
describe("parseInsaDateTime", () => {
  it("parses date+time with explicit CET offset (tz=60)", () => {
    const result = parseInsaDateTime("2026-03-15", "10:30:00", 60);
    expect(result).toBe(new Date("2026-03-15T10:30:00+01:00").getTime());
  });

  it("parses date+time with explicit CEST offset (tz=120)", () => {
    const result = parseInsaDateTime("2026-07-15", "14:00:00", 120);
    expect(result).toBe(new Date("2026-07-15T14:00:00+02:00").getTime());
  });

  it("parses with negative tz offset", () => {
    const result = parseInsaDateTime("2026-03-15", "08:00:00", -300);
    expect(result).toBe(new Date("2026-03-15T08:00:00-05:00").getTime());
  });

  it("pads single-digit hour/minute/second", () => {
    const result = parseInsaDateTime("2026-01-05", "9:5:3", 60);
    expect(result).toBe(new Date("2026-01-05T09:05:03+01:00").getTime());
  });

  it("handles midnight", () => {
    const result = parseInsaDateTime("2026-06-01", "0:0:0", 120);
    expect(result).toBe(new Date("2026-06-01T00:00:00+02:00").getTime());
  });

  it("handles time with missing seconds (treated as 0)", () => {
    const result = parseInsaDateTime("2026-03-15", "10:30", 60);
    expect(result).toBe(new Date("2026-03-15T10:30:00+01:00").getTime());
  });

  it("falls back to Berlin timezone when tz is undefined (CET winter)", () => {
    const result = parseInsaDateTime("2026-01-15", "10:30:00");
    // January = CET (+01:00)
    expect(result).toBe(new Date("2026-01-15T10:30:00+01:00").getTime());
  });

  it("falls back correctly during CEST (summer)", () => {
    const result = parseInsaDateTime("2026-07-15", "14:00:00");
    // July = CEST (+02:00)
    expect(result).toBe(new Date("2026-07-15T14:00:00+02:00").getTime());
  });

  it("handles tz offset of 0 (UTC)", () => {
    const result = parseInsaDateTime("2026-03-15", "12:00:00", 0);
    expect(result).toBe(new Date("2026-03-15T12:00:00+00:00").getTime());
  });
});

// ---------------------------------------------------------------------------
// parseIsoDuration
// ---------------------------------------------------------------------------
describe("parseIsoDuration", () => {
  it("parses minutes only (PT3M)", () => {
    expect(parseIsoDuration("PT3M")).toBe(3 * 60 * 1000);
  });

  it("parses hours and minutes (PT1H37M)", () => {
    expect(parseIsoDuration("PT1H37M")).toBe((3600 + 37 * 60) * 1000);
  });

  it("parses days and hours (P1DT2H)", () => {
    expect(parseIsoDuration("P1DT2H")).toBe((24 + 2) * 3600 * 1000);
  });

  it("parses zero duration (PT0S)", () => {
    expect(parseIsoDuration("PT0S")).toBe(0);
  });

  it("parses hours only (PT2H)", () => {
    expect(parseIsoDuration("PT2H")).toBe(2 * 3600 * 1000);
  });

  it("parses seconds only (PT45S)", () => {
    expect(parseIsoDuration("PT45S")).toBe(45 * 1000);
  });

  it("parses full format (P2DT3H15M30S)", () => {
    const expected = ((2 * 24 + 3) * 3600 + 15 * 60 + 30) * 1000;
    expect(parseIsoDuration("P2DT3H15M30S")).toBe(expected);
  });

  it("returns 0 for invalid string", () => {
    expect(parseIsoDuration("not-a-duration")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseIsoDuration("")).toBe(0);
  });

  it("parses days only (P3D)", () => {
    expect(parseIsoDuration("P3D")).toBe(3 * 24 * 3600 * 1000);
  });
});

// ---------------------------------------------------------------------------
// formatTimeHHMM
// ---------------------------------------------------------------------------
describe("formatTimeHHMM", () => {
  it("formats CET time to HH:mm", () => {
    const epoch = new Date("2026-03-15T10:30:00+01:00").getTime();
    expect(formatTimeHHMM(epoch)).toBe("10:30");
  });

  it("formats CEST time to HH:mm", () => {
    const epoch = new Date("2026-07-15T14:00:00+02:00").getTime();
    expect(formatTimeHHMM(epoch)).toBe("14:00");
  });

  it("formats midnight Berlin time", () => {
    const epoch = new Date("2026-03-15T00:00:00+01:00").getTime();
    expect(formatTimeHHMM(epoch)).toBe("00:00");
  });

  it("formats 23:59 Berlin time", () => {
    const epoch = new Date("2026-03-15T23:59:00+01:00").getTime();
    expect(formatTimeHHMM(epoch)).toBe("23:59");
  });
});

// ---------------------------------------------------------------------------
// formatDurationHHMM
// ---------------------------------------------------------------------------
describe("formatDurationHHMM", () => {
  it("returns minutes only when under 1 hour", () => {
    expect(formatDurationHHMM(25 * 60000)).toBe("25min");
  });

  it("returns hours only when minutes are 0", () => {
    expect(formatDurationHHMM(2 * 3600000)).toBe("2h");
  });

  it("returns hours and minutes", () => {
    expect(formatDurationHHMM(3600000 + 37 * 60000)).toBe("1h 37min");
  });

  it("returns 0min for 0ms", () => {
    expect(formatDurationHHMM(0)).toBe("0min");
  });

  it("returns 1min for 1 minute", () => {
    expect(formatDurationHHMM(60000)).toBe("1min");
  });

  it("returns 1h for exactly 60 minutes", () => {
    expect(formatDurationHHMM(3600000)).toBe("1h");
  });

  it("rounds to nearest minute", () => {
    // 30.5 min → rounds to 31 min
    expect(formatDurationHHMM(30.5 * 60000)).toBe("31min");
  });
});

// ---------------------------------------------------------------------------
// travelModesToProducts
// ---------------------------------------------------------------------------
describe("travelModesToProducts", () => {
  it("returns 127 (all) for empty array", () => {
    expect(travelModesToProducts([])).toBe(127);
  });

  it("returns 127 for TRANSIT", () => {
    expect(travelModesToProducts(["TRANSIT"])).toBe(127);
  });

  it("maps single BUS mode to 64", () => {
    expect(travelModesToProducts(["BUS"])).toBe(64);
  });

  it("maps single TRAM mode to 32", () => {
    expect(travelModesToProducts(["TRAM"])).toBe(32);
  });

  it("ORs multiple modes together (BUS|TRAM=96)", () => {
    expect(travelModesToProducts(["BUS", "TRAM"])).toBe(96);
  });

  it("ORs BUS|SUBURB|TRAIN = 88", () => {
    expect(travelModesToProducts(["BUS", "SUBURB", "TRAIN"])).toBe(64 | 16 | 8);
  });

  it("returns 127 for unknown modes only", () => {
    expect(travelModesToProducts(["WALK", "BICYCLE"])).toBe(127);
  });

  it("ignores unknown modes when known modes present", () => {
    expect(travelModesToProducts(["BUS", "WALK"])).toBe(64);
  });

  it("TRANSIT dominates (127 even with others)", () => {
    expect(travelModesToProducts(["TRANSIT", "BUS"])).toBe(127);
  });

  it("maps ICE to 1, IC to 2, RE/RRB/TRAIN to 8", () => {
    expect(travelModesToProducts(["ICE"])).toBe(1);
    expect(travelModesToProducts(["IC"])).toBe(2);
    expect(travelModesToProducts(["RE"])).toBe(8);
    expect(travelModesToProducts(["RRB"])).toBe(8);
    expect(travelModesToProducts(["TRAIN"])).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// insaCategoryToOtpMode
// ---------------------------------------------------------------------------
describe("insaCategoryToOtpMode", () => {
  it("maps 'Bus' → BUS", () => {
    expect(insaCategoryToOtpMode("Bus", "6")).toBe("BUS");
  });

  it("maps 'Tram' → TRAM", () => {
    expect(insaCategoryToOtpMode("Tram", "5")).toBe("TRAM");
  });

  it("maps 'STR' → TRAM", () => {
    expect(insaCategoryToOtpMode("STR", "5")).toBe("TRAM");
  });

  it("maps 'Str' → TRAM", () => {
    expect(insaCategoryToOtpMode("Str", "5")).toBe("TRAM");
  });

  it("maps 'S' → SUBURB", () => {
    expect(insaCategoryToOtpMode("S", "4")).toBe("SUBURB");
  });

  it("maps 'RE' → TRAIN", () => {
    expect(insaCategoryToOtpMode("RE", "0")).toBe("TRAIN");
  });

  it("maps 'RB' → TRAIN", () => {
    expect(insaCategoryToOtpMode("RB", "0")).toBe("TRAIN");
  });

  it("maps 'ICE' → TRAIN", () => {
    expect(insaCategoryToOtpMode("ICE", "0")).toBe("TRAIN");
  });

  it("maps 'IC' → TRAIN", () => {
    expect(insaCategoryToOtpMode("IC", "0")).toBe("TRAIN");
  });

  it("maps 'EC' → TRAIN", () => {
    expect(insaCategoryToOtpMode("EC", "0")).toBe("TRAIN");
  });

  it("maps 'Train' → TRAIN", () => {
    expect(insaCategoryToOtpMode("Train", "0")).toBe("TRAIN");
  });

  it("falls back to catCode when catOut unknown", () => {
    expect(insaCategoryToOtpMode("Unknown", "0")).toBe("TRAIN");
    expect(insaCategoryToOtpMode("Unknown", "4")).toBe("SUBURB");
    expect(insaCategoryToOtpMode("Unknown", "5")).toBe("TRAM");
    expect(insaCategoryToOtpMode("Unknown", "6")).toBe("BUS");
  });

  it("returns BUS when both catOut and catCode unknown", () => {
    expect(insaCategoryToOtpMode("Zeppelin", "99")).toBe("BUS");
  });

  it("trims whitespace from catOut", () => {
    expect(insaCategoryToOtpMode("  Bus  ", "6")).toBe("BUS");
  });
});

// ---------------------------------------------------------------------------
// decodeGooglePolyline
// ---------------------------------------------------------------------------
describe("decodeGooglePolyline", () => {
  it("decodes Google's canonical 3-point example", () => {
    const points = decodeGooglePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 4);
    expect(points[0].lon).toBeCloseTo(-120.2, 4);
    expect(points[1].lat).toBeCloseTo(40.7, 4);
    expect(points[1].lon).toBeCloseTo(-120.95, 4);
    expect(points[2].lat).toBeCloseTo(43.252, 4);
    expect(points[2].lon).toBeCloseTo(-126.453, 4);
  });

  it("returns empty array for empty string", () => {
    expect(decodeGooglePolyline("")).toEqual([]);
  });

  it("returns {lat, lon} not {lat, lng}", () => {
    const points = decodeGooglePolyline("_p~iF~ps|U");
    expect(points[0]).toHaveProperty("lat");
    expect(points[0]).toHaveProperty("lon");
    expect(points[0]).not.toHaveProperty("lng");
  });
});
