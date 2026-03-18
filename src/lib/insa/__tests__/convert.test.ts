import { describe, it, expect } from "vitest";
import { convertStop, convertLeg, convertTrip, convertInsaToOtpResponse } from "../convert";
import type { InsaStop, InsaLeg, InsaTrip, InsaLocation, InsaTripResponse } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mkLocation(overrides?: Partial<InsaLocation>): InsaLocation {
  return {
    name: "Leipzig Hbf",
    type: "ST",
    id: "008010205",
    extId: "8010205",
    lon: 12.3822,
    lat: 51.3455,
    time: "14:30:00",
    date: "2026-03-18",
    ...overrides,
  };
}

function mkStop(overrides?: Partial<InsaStop>): InsaStop {
  return {
    name: "Goerdelerring",
    extId: "0013001",
    lon: 12.3731,
    lat: 51.3447,
    arrTime: "14:35:00",
    arrDate: "2026-03-18",
    depTime: "14:36:00",
    depDate: "2026-03-18",
    ...overrides,
  };
}

function mkLeg(overrides?: Partial<InsaLeg>): InsaLeg {
  return {
    Origin: mkLocation(),
    Destination: mkLocation({ name: "Goerdelerring", time: "14:45:00" }),
    type: "JNY",
    duration: "PT15M",
    id: "leg-1",
    idx: 0,
    ...overrides,
  };
}

function mkTrip(overrides?: Partial<InsaTrip>): InsaTrip {
  return {
    Origin: mkLocation(),
    Destination: mkLocation({ name: "Connewitz", time: "15:30:00" }),
    LegList: { Leg: [mkLeg()] },
    duration: "PT1H",
    tripId: "trip-1",
    idx: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// convertStop
// ---------------------------------------------------------------------------
describe("convertStop", () => {
  const fallback = "2026-03-18";

  it("converts a fully populated stop", () => {
    const result = convertStop(mkStop(), fallback);
    expect(result.name).toBe("Goerdelerring");
    expect(result.stopId).toBe("0013001");
    expect(result.lon).toBe(12.3731);
    expect(result.lat).toBe(51.3447);
    expect(result.arrival).toBeTypeOf("number");
    expect(result.departure).toBeTypeOf("number");
    expect(result.arrival!).toBeLessThan(result.departure!);
  });

  it("uses fallbackDate when arrDate/depDate missing", () => {
    const stop = mkStop({ arrDate: undefined, depDate: undefined });
    const result = convertStop(stop, fallback);
    expect(result.arrival).toBeTypeOf("number");
    expect(result.departure).toBeTypeOf("number");
  });

  it("leaves arrival undefined when arrTime missing", () => {
    const result = convertStop(mkStop({ arrTime: undefined }), fallback);
    expect(result.arrival).toBeUndefined();
    expect(result.departure).toBeTypeOf("number");
  });

  it("leaves departure undefined when depTime missing", () => {
    const result = convertStop(mkStop({ depTime: undefined }), fallback);
    expect(result.departure).toBeUndefined();
    expect(result.arrival).toBeTypeOf("number");
  });

  it("defaults stopId to empty string when extId missing", () => {
    const result = convertStop(mkStop({ extId: undefined }), fallback);
    expect(result.stopId).toBe("");
  });

  it("defaults lon/lat to 0 when missing", () => {
    const result = convertStop(mkStop({ lon: undefined, lat: undefined }), fallback);
    expect(result.lon).toBe(0);
    expect(result.lat).toBe(0);
  });

  it("uses arrTrack when available", () => {
    const result = convertStop(mkStop({ arrTrack: "3" }), fallback);
    expect(result.track).toBe("3");
  });

  it("falls back to depTrack when arrTrack missing", () => {
    const result = convertStop(mkStop({ arrTrack: undefined, depTrack: "5" }), fallback);
    expect(result.track).toBe("5");
  });

  it("track is null when both tracks missing", () => {
    const result = convertStop(mkStop({ arrTrack: undefined, depTrack: undefined }), fallback);
    expect(result.track).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// convertLeg
// ---------------------------------------------------------------------------
describe("convertLeg", () => {
  describe("non-transit legs", () => {
    it("WALK produces NonTransitLeg with mode WALK", () => {
      const result = convertLeg(mkLeg({ type: "WALK", dist: 450 }));
      expect(result.transitLeg).toBe(false);
      expect(result.mode).toBe("WALK");
      expect(result.distance).toBe(450);
    });

    it("uses GisRoute.dist as fallback distance", () => {
      const result = convertLeg(mkLeg({ type: "WALK", dist: undefined, GisRoute: { dist: 320 } }));
      expect(result.distance).toBe(320);
    });

    it("distance defaults to 0 when no dist or GisRoute", () => {
      const result = convertLeg(mkLeg({ type: "WALK", dist: undefined }));
      expect(result.distance).toBe(0);
    });

    it("from/to are FromToLocation (no stopId)", () => {
      const result = convertLeg(mkLeg({ type: "WALK" }));
      expect("stopId" in result.from).toBe(false);
      expect("stopId" in result.to).toBe(false);
    });

    it("TRSF treated as non-transit", () => {
      const result = convertLeg(mkLeg({ type: "TRSF" }));
      expect(result.transitLeg).toBe(false);
      expect(result.mode).toBe("WALK");
    });

    it("KISS treated as non-transit", () => {
      expect(convertLeg(mkLeg({ type: "KISS" })).transitLeg).toBe(false);
    });

    it("BIKE treated as non-transit", () => {
      expect(convertLeg(mkLeg({ type: "BIKE" })).transitLeg).toBe(false);
    });
  });

  describe("transit (JNY) legs", () => {
    it("produces TransitLeg with transitLeg:true and correct mode", () => {
      const leg = mkLeg({
        Product: [{ name: "Tram 11", catOut: "Tram", catCode: "5", cls: "32", displayNumber: "11" }],
        direction: "Wahren",
      });
      const result = convertLeg(leg);
      expect(result.transitLeg).toBe(true);
      if (!result.transitLeg) return;
      expect(result.mode).toBe("TRAM");
      expect(result.headsign).toBe("Wahren");
      expect(result.route).toBe("11");
    });

    it("maps Bus category correctly", () => {
      const result = convertLeg(mkLeg({
        Product: [{ name: "Bus 74", catOut: "Bus", catCode: "6", cls: "64", displayNumber: "74" }],
      }));
      if (result.transitLeg) expect(result.mode).toBe("BUS");
    });

    it("maps S-Bahn category correctly", () => {
      const result = convertLeg(mkLeg({
        Product: [{ name: "S1", catOut: "S", catCode: "4", cls: "16", displayNumber: "S1" }],
      }));
      if (result.transitLeg) expect(result.mode).toBe("SUBURB");
    });

    it("defaults mode to BUS when Product missing", () => {
      const result = convertLeg(mkLeg({ Product: undefined }));
      if (result.transitLeg) expect(result.mode).toBe("BUS");
    });

    it("from/to are Station (have stopId)", () => {
      const result = convertLeg(mkLeg());
      expect("stopId" in result.from).toBe(true);
      expect("stopId" in result.to).toBe(true);
    });

    it("populates agency from Product.operator", () => {
      const result = convertLeg(mkLeg({
        Product: [{ name: "Tram 11", catOut: "Tram", catCode: "5", cls: "32", operator: "LVB", operatorCode: "lvb" }],
      }));
      if (result.transitLeg) {
        expect(result.agencyName).toBe("LVB");
        expect(result.agencyId).toBe("lvb");
      }
    });
  });

  describe("Stops.Stop handling", () => {
    it("extracts middle stops from 3+ stops", () => {
      const stops = [mkStop({ name: "First" }), mkStop({ name: "Mid1" }), mkStop({ name: "Mid2" }), mkStop({ name: "Last" })];
      const result = convertLeg(mkLeg({ Stops: { Stop: stops } }));
      if (result.transitLeg) {
        expect(result.intermediateStops).toHaveLength(2);
        expect(result.intermediateStops[0].name).toBe("Mid1");
        expect(result.intermediateStops[1].name).toBe("Mid2");
      }
    });

    it("empty intermediates for exactly 2 stops", () => {
      const result = convertLeg(mkLeg({ Stops: { Stop: [mkStop(), mkStop()] } }));
      if (result.transitLeg) expect(result.intermediateStops).toHaveLength(0);
    });

    it("empty intermediates for 1 stop", () => {
      const result = convertLeg(mkLeg({ Stops: { Stop: [mkStop()] } }));
      if (result.transitLeg) expect(result.intermediateStops).toHaveLength(0);
    });

    it("handles Stops.Stop as single object (non-array)", () => {
      const result = convertLeg(mkLeg({ Stops: { Stop: mkStop() as unknown as InsaStop[] } }));
      if (result.transitLeg) expect(result.intermediateStops).toHaveLength(0);
    });

    it("handles missing Stops entirely", () => {
      const result = convertLeg(mkLeg({ Stops: undefined }));
      if (result.transitLeg) expect(result.intermediateStops).toHaveLength(0);
    });
  });

  describe("geometry and duration", () => {
    it("falls back to straight line when no polyline data", () => {
      const result = convertLeg(mkLeg({ type: "WALK" }));
      expect(result.legGeometry.points).toHaveLength(2);
    });

    it("converts ISO duration to seconds", () => {
      expect(convertLeg(mkLeg({ duration: "PT15M" })).duration).toBe(900);
    });
  });
});

// ---------------------------------------------------------------------------
// convertTrip
// ---------------------------------------------------------------------------
describe("convertTrip", () => {
  it("converts single transit leg trip with 0 transfers", () => {
    const result = convertTrip(mkTrip({
      LegList: { Leg: [mkLeg({ duration: "PT15M" })] },
      duration: "PT15M",
    }));
    expect(result.legs).toHaveLength(1);
    expect(result.transfers).toBe(0);
    expect(result.transitTime).toBe(900);
    expect(result.walkTime).toBe(0);
  });

  it("computes transfers = transitLegCount - 1 for mixed legs", () => {
    const result = convertTrip(mkTrip({
      LegList: {
        Leg: [
          mkLeg({ type: "WALK", duration: "PT5M", dist: 300 }),
          mkLeg({ type: "JNY", duration: "PT10M" }),
          mkLeg({ type: "WALK", duration: "PT3M", dist: 200 }),
          mkLeg({ type: "JNY", duration: "PT20M" }),
        ],
      },
      duration: "PT45M",
    }));
    expect(result.transfers).toBe(1);
    expect(result.walkTime).toBe(480);
    expect(result.transitTime).toBe(1800);
    expect(result.walkDistance).toBe(500);
  });

  it("walk-only trip has 0 transfers", () => {
    const result = convertTrip(mkTrip({
      LegList: { Leg: [mkLeg({ type: "WALK", duration: "PT10M", dist: 800 })] },
      duration: "PT10M",
    }));
    expect(result.transfers).toBe(0);
    expect(result.transitTime).toBe(0);
    expect(result.walkDistance).toBe(800);
  });

  it("waitingTime = max(0, total - walk - transit)", () => {
    const result = convertTrip(mkTrip({
      LegList: { Leg: [mkLeg({ type: "WALK", duration: "PT5M" }), mkLeg({ type: "JNY", duration: "PT10M" })] },
      duration: "PT20M",
    }));
    expect(result.waitingTime).toBe(300);
  });

  it("waitingTime floors at 0", () => {
    const result = convertTrip(mkTrip({
      LegList: { Leg: [mkLeg({ duration: "PT10M" })] },
      duration: "PT10M",
    }));
    expect(result.waitingTime).toBe(0);
  });

  it("sets zoneInfo to null", () => {
    expect(convertTrip(mkTrip()).zoneInfo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// convertInsaToOtpResponse
// ---------------------------------------------------------------------------
describe("convertInsaToOtpResponse", () => {
  const from = { lat: 51.3455, lon: 12.3822 };
  const to = { lat: 51.3397, lon: 12.3731 };

  it("wraps trips in OTP envelope", () => {
    const result = convertInsaToOtpResponse({ Trip: [mkTrip()] }, "Hbf", "Markt", from, to);
    expect(result.RetStatus.Value).toBe("OK");
    expect(result.requestParameters.Travelmode).toBe("INSA");
    expect(result.plan?.itineraries).toHaveLength(1);
  });

  it("sets plan.from/to with names and coords", () => {
    const result = convertInsaToOtpResponse({ Trip: [mkTrip()] }, "Start", "End", from, to);
    expect(result.plan?.from).toEqual({ name: "Start", lon: 12.3822, lat: 51.3455 });
    expect(result.plan?.to).toEqual({ name: "End", lon: 12.3731, lat: 51.3397 });
  });

  it("handles empty Trip array", () => {
    const result = convertInsaToOtpResponse({ Trip: [] }, "A", "B", from, to);
    expect(result.plan?.itineraries).toHaveLength(0);
  });

  it("handles undefined Trip", () => {
    const result = convertInsaToOtpResponse({}, "A", "B", from, to);
    expect(result.plan?.itineraries).toHaveLength(0);
  });

  it("uses first itinerary startTime as plan.date", () => {
    const result = convertInsaToOtpResponse({ Trip: [mkTrip()] }, "A", "B", from, to);
    expect(result.plan?.date).toBe(result.plan?.itineraries[0].startTime);
  });

  it("attaches _rawApiResponse", () => {
    const raw: InsaTripResponse = { Trip: [mkTrip()], serverVersion: "2.49" };
    const result = convertInsaToOtpResponse(raw, "A", "B", from, to);
    expect(result._rawApiResponse).toBe(raw);
  });
});
