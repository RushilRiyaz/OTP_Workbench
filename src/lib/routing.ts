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

// Basic response types (expanded in Sprint 2)
export interface RoutingResponse {
  RetStatus: {
    Value: string;
    Comments: string;
  };
  requestParameters: {
    From: string;
    To: string;
    Travelmode: string;
    changeSource: string;
    transitOnly: boolean;
    mockup: boolean;
  };
  plan?: {
    date: number;
    from: { name: string; lon: number; lat: number };
    to: { name: string; lon: number; lat: number };
    itineraries: Itinerary[];
  };
}

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
}

export interface Leg {
  startTime: number;
  endTime: number;
  departureDelay: number;
  arrivalDelay: number;
  realTime: boolean;
  distance: number;
  mode: string;
  route: string;
  from: { name: string; stopId?: string; lat: number; lon: number };
  to: { name: string; stopId?: string; lat: number; lon: number };
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
  signal?: AbortSignal
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
  queryParams.set("api_key", API_KEY);

  const url = `${API_BASE_URL}/otp?${queryParams}`;

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

    return { success: true, data };
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
