// INSA → OTP response conversion

import type {
  RoutingResponse,
  Itinerary,
  Leg,
  TransitLeg,
  NonTransitLeg,
  Station,
  FromToLocation,
  LegGeometry,
} from "../routing";
import type { InsaTripResponse, InsaTrip, InsaLeg, InsaStop, InsaLocation } from "./types";
import {
  parseInsaDateTime,
  parseIsoDuration,
  formatTimeHHMM,
  formatDurationHHMM,
  insaCategoryToOtpMode,
  decodeGooglePolyline,
} from "./utils";

// ---------------------------------------------------------------------------
// Geometry Extraction
// ---------------------------------------------------------------------------

/** Extract polyline geometry from an INSA leg */
function extractLegGeometry(leg: InsaLeg): LegGeometry {
  const polyGroup = leg.PolylineGroup?.polylineDesc ?? leg.GisRoute?.polylineDesc;
  if (polyGroup && polyGroup.length > 0) {
    const desc = polyGroup[0];
    if (desc.crdEncYX) {
      try {
        const points = decodeGooglePolyline(desc.crdEncYX);
        if (points.length > 0) return { points };
      } catch {
        // Fall through to fallback
      }
    }
  }

  // Fallback: straight line between origin and destination
  const points: Array<{ lat: number; lon: number }> = [];
  if (leg.Origin.lat && leg.Origin.lon) {
    points.push({ lat: leg.Origin.lat, lon: leg.Origin.lon });
  }
  if (leg.Destination.lat && leg.Destination.lon) {
    points.push({ lat: leg.Destination.lat, lon: leg.Destination.lon });
  }
  return { points };
}

// ---------------------------------------------------------------------------
// Location / Stop Converters
// ---------------------------------------------------------------------------

/** Convert an INSA Stop → OTP Station */
export function convertStop(stop: InsaStop, fallbackDate: string): Station {
  const arrival = stop.arrTime
    ? parseInsaDateTime(stop.arrDate || fallbackDate, stop.arrTime, stop.arrTz)
    : undefined;
  const departure = stop.depTime
    ? parseInsaDateTime(stop.depDate || fallbackDate, stop.depTime, stop.depTz)
    : undefined;

  return {
    name: stop.name,
    stopId: stop.extId || "",
    lon: stop.lon || 0,
    lat: stop.lat || 0,
    zoneId: "",
    wheelchairBoarding: 0,
    track: stop.arrTrack || stop.depTrack || null,
    scheduledTrack: null,
    cancelled: false,
    arrival,
    departure,
    arrivalDelay: 0,
    departureDelay: 0,
    ...(arrival ? { arrivalDelayedTime: arrival, arrivalDelayedTimeHHMM: formatTimeHHMM(arrival) } : {}),
    ...(departure ? { departureDelayedTime: departure, departureDelayedTimeHHMM: formatTimeHHMM(departure) } : {}),
  };
}

/** Convert an INSA Location → OTP Station */
function locationToStation(loc: InsaLocation): Station {
  const time = parseInsaDateTime(loc.date, loc.time, loc.tz);
  return {
    name: loc.name,
    stopId: loc.extId || "",
    lon: loc.lon,
    lat: loc.lat,
    zoneId: "",
    wheelchairBoarding: 0,
    track: null,
    scheduledTrack: null,
    cancelled: false,
    departure: time,
    arrival: time,
    departureDelay: 0,
    arrivalDelay: 0,
    departureDelayedTime: time,
    arrivalDelayedTime: time,
    departureDelayedTimeHHMM: formatTimeHHMM(time),
    arrivalDelayedTimeHHMM: formatTimeHHMM(time),
  };
}

/** Convert an INSA Location → OTP FromToLocation (for walk legs) */
function locationToFromTo(loc: InsaLocation): FromToLocation {
  const time = parseInsaDateTime(loc.date, loc.time, loc.tz);
  return {
    name: loc.name,
    lon: loc.lon,
    lat: loc.lat,
    departure: time,
    arrival: time,
    departureDelay: 0,
    arrivalDelay: 0,
    departureDelayedTime: time,
    arrivalDelayedTime: time,
    departureDelayedTimeHHMM: formatTimeHHMM(time),
    arrivalDelayedTimeHHMM: formatTimeHHMM(time),
  };
}

// ---------------------------------------------------------------------------
// Leg Conversion
// ---------------------------------------------------------------------------

/** Convert a single INSA Leg → OTP Leg */
export function convertLeg(leg: InsaLeg): Leg {
  const startTime = parseInsaDateTime(leg.Origin.date, leg.Origin.time, leg.Origin.tz);
  const endTime = parseInsaDateTime(leg.Destination.date, leg.Destination.time, leg.Destination.tz);
  const durationMs = parseIsoDuration(leg.duration);
  const legGeometry = extractLegGeometry(leg);

  const baseLeg = {
    startTime,
    endTime,
    departureDelay: 0,
    arrivalDelay: 0,
    realTime: false,
    distance: leg.dist || 0,
    duration: Math.round(durationMs / 1000),
    departureDelayedTime: startTime,
    arrivalDelayedTime: endTime,
    legGeometry,
    rentedBike: false,
    alerts: [],
    startTimeHHMM: formatTimeHHMM(startTime),
    endTimeHHMM: formatTimeHHMM(endTime),
  };

  // Non-transit leg (WALK, TRSF, KISS, BIKE, TAXI, or any unknown type)
  if (leg.type !== "JNY") {
    const nonTransit: NonTransitLeg = {
      ...baseLeg,
      transitLeg: false,
      mode: "WALK",
      from: locationToFromTo(leg.Origin),
      to: locationToFromTo(leg.Destination),
      distance: leg.dist || leg.GisRoute?.dist || 0,
    };
    return nonTransit;
  }

  // Transit leg (JNY)
  const product = leg.Product?.[0];
  const mode = product
    ? insaCategoryToOtpMode(product.catOut, product.catCode)
    : "BUS";

  const raw = leg.Stops?.Stop;
  const allStops = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const intermediateStops =
    allStops.length > 2
      ? allStops.slice(1, -1).map((s) => convertStop(s, leg.Origin.date))
      : [];

  const transit: TransitLeg = {
    ...baseLeg,
    transitLeg: true,
    mode,
    from: locationToStation(leg.Origin),
    to: locationToStation(leg.Destination),
    route: product?.displayNumber || leg.name || "",
    agencyName: product?.operator || product?.operatorInfo?.name || "",
    agencyUrl: "",
    agencyId: product?.operatorCode || "",
    wheelchairAccessible: 0,
    routeColor: "",
    routeType: parseInt(product?.catCode || "0", 10),
    routeId: product?.lineId || "",
    headsign: leg.direction || "",
    tripId: leg.id || "",
    serviceDate: leg.JourneyDetail?.dayOfOperation || leg.Origin.date,
    routeShortName: product?.displayNumber || product?.line || leg.number || "",
    routeLongName: product?.name || leg.name || "",
    intermediateStops,
    cancelled: false,
    wheelchairBoardingVehicle: 0,
  };

  return transit;
}

// ---------------------------------------------------------------------------
// Trip / Response Conversion
// ---------------------------------------------------------------------------

/** Convert a single INSA Trip → OTP Itinerary */
export function convertTrip(trip: InsaTrip): Itinerary {
  const legs = trip.LegList.Leg.map(convertLeg);

  const startTime = parseInsaDateTime(trip.Origin.date, trip.Origin.time, trip.Origin.tz);
  const endTime = parseInsaDateTime(trip.Destination.date, trip.Destination.time, trip.Destination.tz);
  const durationMs = parseIsoDuration(trip.duration);

  let walkTimeMs = 0;
  let transitTimeMs = 0;
  let walkDistance = 0;
  let transitLegCount = 0;

  for (const leg of legs) {
    const legDurMs = leg.duration * 1000;
    if (leg.transitLeg) {
      transitTimeMs += legDurMs;
      transitLegCount++;
    } else {
      walkTimeMs += legDurMs;
      walkDistance += leg.distance;
    }
  }

  const waitingTimeMs = Math.max(0, durationMs - walkTimeMs - transitTimeMs);

  return {
    duration: Math.round(durationMs / 1000),
    startTime,
    endTime,
    walkTime: Math.round(walkTimeMs / 1000),
    transitTime: Math.round(transitTimeMs / 1000),
    waitingTime: Math.round(waitingTimeMs / 1000),
    walkDistance,
    transfers: Math.max(0, transitLegCount - 1),
    legs,
    zoneInfo: null,
    startTimeHHMM: formatTimeHHMM(startTime),
    endTimeHHMM: formatTimeHHMM(endTime),
    durationHHMM: formatDurationHHMM(durationMs),
  };
}

/** Convert full INSA response → OTP RoutingResponse */
export function convertInsaToOtpResponse(
  insaResponse: InsaTripResponse,
  fromName: string,
  toName: string,
  fromCoords: { lat: number; lon: number },
  toCoords: { lat: number; lon: number },
): RoutingResponse {
  const trips = insaResponse.Trip ?? [];
  const itineraries = trips.map(convertTrip);

  return {
    RetStatus: { Value: "OK", Comments: "" },
    requestParameters: {
      From: `${fromCoords.lat},${fromCoords.lon}`,
      To: `${toCoords.lat},${toCoords.lon}`,
      Travelmode: "INSA",
      transitOnly: false,
      mockup: false,
    },
    plan: {
      date: itineraries[0]?.startTime ?? Date.now(),
      from: { name: fromName, lon: fromCoords.lon, lat: fromCoords.lat },
      to: { name: toName, lon: toCoords.lon, lat: toCoords.lat },
      itineraries,
    },
    _rawApiResponse: insaResponse,
  };
}
