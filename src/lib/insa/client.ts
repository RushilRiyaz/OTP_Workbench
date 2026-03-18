// INSA Routing API fetch client

import type { RoutingRequestParams, RoutingResult } from "../routing";
import type { LocationValue } from "@/lib/types";
import type { InsaTripResponse } from "./types";
import { travelModesToProducts } from "./utils";
import { convertInsaToOtpResponse } from "./convert";

const INSA_API_URL = process.env.NEXT_PUBLIC_INSA_API_URL || "https://reiseauskunft.insa.de/restproxy/2.49/trip";
const INSA_ACCESS_ID = process.env.NEXT_PUBLIC_INSA_ACCESS_ID || "your-access-id-here";
const REQUEST_TIMEOUT_MS = 30000;

/** Resolve coordinates from a LocationValue, or null if only a bare stop ID */
function resolveCoordinates(
  location: LocationValue
): { lat: number; lon: number; name: string } | null {
  if (location.type === "coordinates" && location.coordinates) {
    return { lat: location.coordinates.lat, lon: location.coordinates.lon, name: location.text };
  }
  if (location.type === "autocomplete" && location.location) {
    return { lat: location.location.lat, lon: location.location.lon, name: location.location.name || location.text };
  }
  return null;
}

/** FR22-FR29: Fetch routing from the INSA API and return normalized OTP response */
export async function fetchInsaRouting(
  params: RoutingRequestParams,
  signal?: AbortSignal,
  options?: { context?: string },
): Promise<RoutingResult> {
  const { start, destination, dateTime, routingOptions } = params;

  // FR23.3: Resolve coordinates — error if bare stop ID
  const origin = resolveCoordinates(start);
  const dest = resolveCoordinates(destination);

  if (!origin) {
    return {
      success: false,
      error: {
        type: "api",
        message: "INSA requires coordinates for the origin. Please use autocomplete or enter coordinates instead of a stop ID.",
      },
    };
  }
  if (!dest) {
    return {
      success: false,
      error: {
        type: "api",
        message: "INSA requires coordinates for the destination. Please use autocomplete or enter coordinates instead of a stop ID.",
      },
    };
  }

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set("accessId", INSA_ACCESS_ID);
  queryParams.set("originCoordLat", String(origin.lat));
  queryParams.set("originCoordLong", String(origin.lon));
  queryParams.set("originCoordName", origin.name);
  queryParams.set("destCoordLat", String(dest.lat));
  queryParams.set("destCoordLong", String(dest.lon));
  queryParams.set("destCoordName", dest.name);

  // FR23.4: Date and time
  if (dateTime) {
    const [datePart, timePart] = dateTime.split("T");
    queryParams.set("date", datePart);
    queryParams.set("time", timePart);
  }

  // FR26.1: Arrive-by
  if (routingOptions.timingMode === "arriveBy") {
    queryParams.set("searchForArrival", "1");
  }

  // FR24: Travel modes → products bitmask
  const products = travelModesToProducts(routingOptions.travelModes);
  queryParams.set("products", String(products));

  // FR23.5: Standard params
  queryParams.set("format", "json");
  queryParams.set("passlist", "1");
  queryParams.set("poly", "1");
  queryParams.set("polyEnc", "GPA");
  queryParams.set("tariff", "false");

  // Scroll pagination: context token overrides date/time positioning
  if (options?.context) {
    queryParams.set("context", options.context);
  }

  const url = `${INSA_API_URL}?${queryParams}`;
  console.log("[INSA Routing API] Request:", url);

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    console.log("[INSA Routing API] Response status:", response.status);

    if (!response.ok) {
      return {
        success: false,
        error: {
          type: "api",
          message: `INSA API returned ${response.status}: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    let data: InsaTripResponse;
    try {
      data = await response.json();
      console.log("[INSA Routing API] Response:", data);
    } catch {
      return {
        success: false,
        error: { type: "parse", message: "Failed to parse INSA API response as JSON" },
      };
    }

    // FR27.2: Check for error response
    if (data.errorCode || data.errorText) {
      return {
        success: false,
        error: {
          type: "api",
          message: data.errorText || `INSA error: ${data.errorCode}`,
        },
      };
    }

    if (!data.Trip || data.Trip.length === 0) {
      return {
        success: false,
        error: { type: "api", message: "INSA API returned no trips" },
      };
    }

    // Convert to OTP format
    const otpResponse = convertInsaToOtpResponse(
      data,
      origin.name,
      dest.name,
      { lat: origin.lat, lon: origin.lon },
      { lat: dest.lat, lon: dest.lon },
    );

    return { success: true, data: otpResponse };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        if (signal?.aborted) {
          return { success: false, error: { type: "network", message: "Request cancelled" } };
        }
        return { success: false, error: { type: "timeout", message: "INSA request timed out after 30 seconds" } };
      }
      return { success: false, error: { type: "network", message: err.message } };
    }
    return { success: false, error: { type: "network", message: "Unknown error occurred" } };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
