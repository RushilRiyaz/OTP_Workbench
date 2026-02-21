// FR6.1: OTP Routing API client

import { LocationValue } from "@/components/LocationInput";
import { RoutingOptions } from "@/components/RoutingOptionsForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_OTP_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

// 30s timeout per CLAUDE.md
const REQUEST_TIMEOUT_MS = 30000;

// Request params for the routing API
export interface RoutingRequestParams {
  start: LocationValue;
  destination: LocationValue;
  dateTime: string; // datetime-local format: YYYY-MM-DDTHH:mm
  routingOptions: RoutingOptions;
}

// --- OTP Response Types (per docs/api_docs/otp_routing_api.md) ---

export interface Alert {
  effectiveStartDate: number;
  effectiveEndDate: number;
  alertHeaderText: string | null;
  alertDescriptionText: string;
  /** 0=Disruption 1=Delay 2=Winter 3=Info 4=Construction 5=Event 6=Connection unreachable */
  alertCategory: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  alertUrl?: string | null;
}

export interface LegGeometry {
  points: Array<{ lat: number; lon: number }>;
}

export interface ZoneInfo {
  zones: string[];
  orderedZones: string[];
  shortDistanceTicket: boolean;
}

export interface BikeInfo {
  bikeName: string;
  bikeId: string;
  bikeTypeName: string | null;
  type: "station" | "bike";
}

export interface CarStationInfo {
  carShareId: string;
  providerAreaId: string;
}

export interface Station {
  name: string;
  stopId: string;
  lon: number;
  lat: number;
  zoneId: string;
  wheelchairBoarding: 0 | 1 | 2;
  /** Spec says Nullable=No but description says "null if unknown" — treating as nullable */
  track: string | null;
  scheduledTrack: string | null;
  cancelled: boolean;
  arrival?: number;
  departure?: number;
  departureDelayedTime?: number;
  arrivalDelayedTime?: number;
  departureDelayedTimeHHMM?: string;
  arrivalDelayedTimeHHMM?: string;
  /** Delay in seconds (API returns minutes; normalizeStationDelays converts to seconds) */
  arrivalDelay?: number;
  /** Delay in seconds (API returns minutes; normalizeStationDelays converts to seconds) */
  departureDelay?: number;
  boardAlightType?: string;
  hafas_id?: string;
  hafas_name?: string;
  alerts?: Alert[];
}

export interface FromToLocation {
  name: string;
  lon: number;
  lat: number;
  arrival?: number;
  departure?: number;
  departureDelayedTime?: number;
  arrivalDelayedTime?: number;
  departureDelayedTimeHHMM?: string;
  arrivalDelayedTimeHHMM?: string;
  /** Delay in seconds */
  arrivalDelay?: number;
  /** Delay in seconds */
  departureDelay?: number;
  bikeShareId?: string;
  bikeInfo?: BikeInfo;
  carStationInfo?: CarStationInfo;
}

export function isStation(loc: Station | FromToLocation): loc is Station {
  return "stopId" in loc;
}

// --- Station delay normalization ---
// API returns Station delays in minutes but FromToLocation/BaseLeg delays in seconds.
// normalizeStationDelays converts Station delays to seconds at the API boundary
// so the entire app uses a uniform seconds unit.

function convertStationDelay(station: Station): void {
  if (station.departureDelay !== undefined) {
    station.departureDelay = station.departureDelay * 60;
  }
  if (station.arrivalDelay !== undefined) {
    station.arrivalDelay = station.arrivalDelay * 60;
  }
}

export function normalizeStationDelays(response: RoutingResponse): RoutingResponse {
  if (!response.plan?.itineraries) return response;

  for (const itinerary of response.plan.itineraries) {
    for (const leg of itinerary.legs) {
      if (leg.transitLeg) {
        convertStationDelay(leg.from);
        convertStationDelay(leg.to);
        for (const stop of leg.intermediateStops) {
          convertStationDelay(stop);
        }
      } else {
        if (isStation(leg.from)) convertStationDelay(leg.from);
        if (isStation(leg.to)) convertStationDelay(leg.to);
      }
    }
  }

  return response;
}

// --- Mode types ---

export type NonTransitMode =
  | "WALK" | "BIKE" | "BIKERENTAL" | "CAR" | "CARRENTAL"
  | "TAXI4884" | "BIKE AND TRANSIT" | "BIKERENTAL-TRANSIT";

export type TransitMode =
  | "BUS" | "TRAM" | "SUBURB" | "TRAIN" | "FLEXA"
  | "SUBWAY" | "FERRY" | "GONDOLA";

export interface Step {
  distance: number;
  relativeDirection: string;
  absoluteDirection: string;
  streetName: string;
  lon: number;
  lat: number;
}

// --- Leg types (discriminated union on transitLeg) ---

export interface BaseLeg {
  startTime: number;
  endTime: number;
  /** Delay in seconds (spec doesn't state unit, inferred from departureDelayedTime - startTime) */
  departureDelay: number;
  /** Delay in seconds (spec doesn't state unit, inferred from arrivalDelayedTime - endTime) */
  arrivalDelay: number;
  realTime: boolean;
  distance: number;
  duration: number;
  departureDelayedTime: number;
  arrivalDelayedTime: number;
  legGeometry: LegGeometry;
  rentedBike: boolean;
  alerts: Alert[];
  departureDelayedTimeHHMM?: string;
  arrivalDelayedTimeHHMM?: string;
  startTimeHHMM?: string;
  endTimeHHMM?: string;
  steps?: Step[];
}

export interface NonTransitLeg extends BaseLeg {
  transitLeg: false;
  mode: NonTransitMode;
  from: Station | FromToLocation;
  to: Station | FromToLocation;
  escooterInfo?: Record<string, unknown>;
  rentedEscooter?: boolean;
}

export interface TransitLeg extends BaseLeg {
  transitLeg: true;
  mode: TransitMode;
  from: Station;
  to: Station;
  route: string;
  agencyName: string;
  agencyUrl?: string;
  wheelchairAccessible: 0 | 1 | 2;
  routeColor: string;
  routeType: number;
  routeId: string;
  headsign: string;
  agencyId: string;
  tripId: string;
  serviceDate: string;
  routeShortName: string;
  routeLongName: string;
  intermediateStops: Station[];
  cancelled: boolean;
  wheelchairBoardingVehicle: 0 | 1 | 2;
  flexaProperties?: Record<string, unknown>;
}

export type Leg = NonTransitLeg | TransitLeg;

// --- Itinerary ---

export interface Itinerary {
  duration: number;
  startTime: number;
  endTime: number;
  walkTime: number;
  transitTime: number;
  waitingTime: number;
  walkDistance: number;
  transfers: number;
  legs: Leg[];
  zoneInfo: ZoneInfo | null;
  otpVersion?: string;
  startTimeHHMM?: string;
  endTimeHHMM?: string;
  durationHHMM?: string;
}

// --- Response envelope ---

export interface RoutingResponse {
  RetStatus: {
    Value: string;
    Comments: string;
  };
  requestParameters: {
    From: string;
    To: string;
    Travelmode: string;
    date?: string;
    time?: string;
    numItineraries?: number;
    arriveBy?: boolean;
    accessibility?: boolean;
    shortWalk?: boolean;
    lessTransfers?: boolean;
    transitOnly: boolean;
    mockup: boolean;
    changeSource?: string; // undocumented, observed in API responses
  };
  plan?: {
    date: number;
    from: { name: string; lon: number; lat: number };
    to: { name: string; lon: number; lat: number };
    itineraries: Itinerary[];
  };
}

export interface RoutingError {
  type: "network" | "timeout" | "api" | "parse";
  message: string;
  status?: number;
}

export type RoutingResult =
  | { success: true; data: RoutingResponse }
  | { success: false; error: RoutingError };

// Convert LocationValue to API format (lat,lon or stopId)
export function formatLocation(location: LocationValue): string {
  if (location.type === "coordinates" && location.coordinates) {
    return `${location.coordinates.lat},${location.coordinates.lon}`;
  }
  if (location.type === "stopId" && location.stopId) {
    return location.stopId;
  }
  if (location.type === "autocomplete" && location.location) {
    return `${location.location.lat},${location.location.lon}`;
  }
  return "";
}

// Convert datetime-local (YYYY-MM-DDTHH:mm) to API format
export function formatDate(dateTime: string): string {
  // Input: 2026-02-03T14:30
  // Output: 02-03-2026
  const [datePart] = dateTime.split("T");
  const [year, month, day] = datePart.split("-");
  return `${month}-${day}-${year}`;
}

export function formatTime(dateTime: string): string {
  // Input: 2026-02-03T14:30
  // Output: 14:30
  const [, timePart] = dateTime.split("T");
  return timePart;
}

export async function fetchRouting(
  params: RoutingRequestParams,
  signal?: AbortSignal,
  options?: { baseUrl?: string; apiKey?: string }
): Promise<RoutingResult> {
  const { start, destination, dateTime, routingOptions } = params;

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set("From", formatLocation(start));
  queryParams.set("To", formatLocation(destination));
  queryParams.set("Travelmode", routingOptions.travelModes.join(","));

  // Date and time
  if (dateTime) {
    queryParams.set("date", formatDate(dateTime));
    queryParams.set("time", formatTime(dateTime));
  }

  // Timing mode
  queryParams.set("arriveBy", routingOptions.timingMode === "arriveBy" ? "true" : "false");

  // Optional params
  if (routingOptions.optionalParams.shortWalk) {
    queryParams.set("shortWalk", "1");
  }
  if (routingOptions.optionalParams.lessTransfers) {
    queryParams.set("lessTransfers", "1");
  }
  if (routingOptions.optionalParams.accessibility) {
    queryParams.set("accessibility", "1");
  }
  if (routingOptions.optionalParams.transitOnly) {
    queryParams.set("transitOnly", "1");
  }

  // Default numItineraries
  if (!queryParams.has("numItineraries")) {
    queryParams.set("numItineraries", "3");
  }

  // Custom params (parse key=value&key2=value2 format)
  // Note: custom params can override defaults but not core params (From, To, Travelmode)
  const protectedParams = ["From", "To", "Travelmode", "date", "time", "arriveBy"];
  if (routingOptions.customParams.trim()) {
    const customPairs = routingOptions.customParams.split("&");
    for (const pair of customPairs) {
      const eqIndex = pair.indexOf("=");
      if (eqIndex > 0) {
        const key = pair.slice(0, eqIndex).trim();
        const value = pair.slice(eqIndex + 1).trim();
        // Don't allow overriding core params
        if (key && !protectedParams.includes(key)) {
          queryParams.set(key, value);
        }
      }
    }
  }

  // FR6: Add API key as query parameter (per LVB API spec)
  const resolvedApiKey = options?.apiKey || API_KEY;
  const resolvedBaseUrl = options?.baseUrl || API_BASE_URL;
  queryParams.set("api_key", resolvedApiKey);

  const url = `${resolvedBaseUrl}/otp?${queryParams}`;

  // Log request per CLAUDE.md
  console.log("[Routing API] Request:", url);

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Link external signal
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    // Log response status
    console.log("[Routing API] Response status:", response.status);

    if (!response.ok) {
      return {
        success: false,
        error: {
          type: "api",
          message: `API returned ${response.status}: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    let data: RoutingResponse;
    try {
      data = await response.json();
      // Log response per CLAUDE.md
      console.log("[Routing API] Response:", data);
    } catch {
      return {
        success: false,
        error: {
          type: "parse",
          message: "Failed to parse API response as JSON",
        },
      };
    }

    // Check API-level error
    if (data.RetStatus?.Value !== "OK") {
      return {
        success: false,
        error: {
          type: "api",
          message: data.RetStatus?.Comments || "API returned error status",
        },
      };
    }

    return { success: true, data: normalizeStationDelays(data) };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        // Check if it was timeout or user abort
        if (signal?.aborted) {
          return {
            success: false,
            error: { type: "network", message: "Request cancelled" },
          };
        }
        return {
          success: false,
          error: { type: "timeout", message: "Request timed out after 30 seconds" },
        };
      }
      return {
        success: false,
        error: { type: "network", message: err.message },
      };
    }
    return {
      success: false,
      error: { type: "network", message: "Unknown error occurred" },
    };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
