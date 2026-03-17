// FR22: NearbySearch API client

const API_BASE_URL =
  process.env.NEXT_PUBLIC_NEARBYSEARCH_API_URL || "";
const API_KEY =
  process.env.NEXT_PUBLIC_NEARBYSEARCH_API_KEY ||
  process.env.NEXT_PUBLIC_API_KEY ||
  "";

// 30s timeout
const REQUEST_TIMEOUT_MS = 30000;

// FR22.4-FR22.6: Enum values from API spec (types, vehicleTypes, sources)

export const NEARBY_TYPES = [
  "station",
  "stop",
  "free_floating",
  "parkingarea",
  "operationarea",
  "mobistation",
] as const;
export type NearbyType = (typeof NEARBY_TYPES)[number];

export const NEARBY_VEHICLE_TYPES = ["car", "bike"] as const;
export type NearbyVehicleType = (typeof NEARBY_VEHICLE_TYPES)[number];

export const NEARBY_SOURCES = [
  "nextbike",
  "cantamen",
  "flinkster",
  "taxi",
  "lvb",
  "gtfs-mdv",
  "escooter",
  "ticket-seller",
  "parkit",
  "flexa",
] as const;
export type NearbySource = (typeof NEARBY_SOURCES)[number];

// FR22: Request types

export interface NearbySearchParams {
  center: { lat: number; lon: number };
  radius: number;
  types?: NearbyType[];
  vehicleTypes?: NearbyVehicleType[];
  sources?: NearbySource[];
  providers?: string[];
  maxResults?: number;
}

// FR22: Response types (from swagger searchItemJson)

export interface NearbySearchItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string; // station | stop | free_floating | parkingarea | operationarea | mobistation | konsum
  source: string;
  provider: string;
  data: Record<string, unknown>;
  prov_id: string;
  mobistation_id: string | null;
}

// --- Result type ---

export interface NearbySearchError {
  type: "network" | "timeout" | "api" | "parse";
  message: string;
  status?: number;
}

export type NearbySearchResult =
  | { success: true; data: NearbySearchItem[] }
  | { success: false; error: NearbySearchError };

// FR24.1: categorize items for map marker coloring

export type MarkerCategory =
  | "bike"
  | "bike_station"
  | "escooter"
  | "escooter_station"
  | "mobistation"
  | "other";

export function categorizeItem(item: NearbySearchItem): MarkerCategory {
  const vehicleType = (item.data?.vehicletype as string) || "";

  // Bikes
  if (
    item.source === "nextbike" ||
    vehicleType === "bike"
  ) {
    return item.type === "station" ? "bike_station" : "bike";
  }

  // E-scooters
  if (
    item.source === "escooter" ||
    vehicleType === "escooter"
  ) {
    return item.type === "station" ? "escooter_station" : "escooter";
  }

  // Mobistations
  if (item.type === "mobistation" || item.source === "lvb") {
    return "mobistation";
  }

  return "other";
}

/** Parse a value that may be a number or a numeric string */
function parseCount(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    if (!isNaN(n)) return n;
  }
  return null;
}

/** FR24.2: Get the count to display on station markers (bikes/escooters available) */
export function getStationCount(item: NearbySearchItem): number | null {
  const data = item.data;
  return (
    parseCount(data.num_available_vehicles) ??
    parseCount(data.num_vehicles) ??
    parseCount(data.available_bikes) ??
    null
  );
}

// FR22: API fetch

export async function fetchNearbySearch(
  params: NearbySearchParams,
  signal?: AbortSignal,
  options?: { baseUrl?: string; apiKey?: string }
): Promise<NearbySearchResult> {
  const resolvedBaseUrl = options?.baseUrl || API_BASE_URL;
  const resolvedApiKey = options?.apiKey || API_KEY;

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set("center", `${params.center.lat},${params.center.lon}`);
  queryParams.set("radius", String(params.radius));

  if (params.types && params.types.length > 0) {
    queryParams.set("types", params.types.join(","));
  }
  if (params.vehicleTypes && params.vehicleTypes.length > 0) {
    queryParams.set("vehicletypes", params.vehicleTypes.join(","));
  }
  if (params.sources && params.sources.length > 0) {
    queryParams.set("sources", params.sources.join(","));
  }
  if (params.providers && params.providers.length > 0) {
    queryParams.set("provider", params.providers.join(","));
  }
  if (params.maxResults !== undefined && params.maxResults > 0) {
    queryParams.set("number", String(params.maxResults));
  }

  const url = `${resolvedBaseUrl}/search?${queryParams}`;

  console.log("[NearbySearch API] Request:", url);

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Link external signal
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-API-Key": resolvedApiKey },
      signal: controller.signal,
    });

    // Log response status
    console.log("[NearbySearch API] Response status:", response.status);

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

    let data: NearbySearchItem[];
    try {
      data = await response.json();
      console.log("[NearbySearch API] Response:", data);
    } catch {
      return {
        success: false,
        error: {
          type: "parse",
          message: "Failed to parse API response as JSON",
        },
      };
    }

    return { success: true, data };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        if (signal?.aborted) {
          return {
            success: false,
            error: { type: "network", message: "Request cancelled" },
          };
        }
        return {
          success: false,
          error: {
            type: "timeout",
            message: "Request timed out after 30 seconds",
          },
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
