// NFR-SM1: Stop Monitor API client

const REQUEST_TIMEOUT_MS = 30000;

// --- Types (per docs/api_docs/stop_monitor_api.md) ---

export interface StopMonitorAlert {
  alertUrl: string;
  effectiveStartDate: number;
  effectiveEndDate: number;
  alertHeaderText: string;
  alertDescriptionText: string;
  /** 0=Disruption 1=Delay 2=Winter 3=Info 4=Construction 5=Event 6=Connection unreachable */
  alertCategory: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface MonitorItem {
  arrival_time: string;            // HH:MM:SS
  date: string;                    // YYYYMMDD
  departure_time: string;          // HH:MM:SS
  departure_date: string;          // YYYYMMDD
  trip_id: string;
  stop_id: string;
  parent_id: string;
  route_id: string;
  trip_headsign: string;
  route_color: string;             // hex without "#" prefix
  directionId: string;             // "0" or "1"
  agencyName: string;
  trip_cancelled: boolean;
  stop_cancelled: boolean;
  trip_accessible_scheduled: boolean | null;
  trip_accessible: boolean | null;
  track_scheduled: string | null;
  track: string | null;
  /** Arrival delay in seconds (+late, -early, null=no info) */
  delay_time: number | null;
  /** Departure delay in seconds (+late, -early, null=no info) */
  departure_delay: number | null;
  /** Minutes from request time to arrival (negative=past) */
  waiting_time: number;
  /** Minutes from request time to departure (negative=past) */
  dep_waiting_time: number;
  alerts: StopMonitorAlert[];
  transport_type: string;          // "Tram" | "Bus" | "S-Bahn" | "Bahn" | "Schienenersatzverkehr" | "Ruf-Bus"
  line: string;
}

export interface StopsItem {
  stop_name: string;
  stop_id: string;
  lat: number;
  lon: number;
  priority: number;
}

export interface StopMonitorRequestParams {
  stopId: string;
  date: string;    // YYYYMMDD
  time: string;    // HH:MM
  minutes?: number;
  arrOnly?: boolean;
  depOnly?: boolean;
}

export interface StopMonitorError {
  type: "network" | "timeout" | "api" | "parse";
  message: string;
  status?: number;
}

export type StopMonitorResult =
  | { success: true; data: MonitorItem[] }
  | { success: false; error: StopMonitorError };

/** Per-environment state for the Stop Monitor results panel */
export interface StopMonitorEnvState {
  data: MonitorItem[] | null;
  error: StopMonitorError | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  /** Current time window in minutes (starts at 60, incremented by "More") */
  minutes: number;
}

// --- Date/time helpers ---

/** Convert datetime-local "YYYY-MM-DDTHH:mm" → "YYYYMMDD" */
export function formatDateForMonitor(dateTime: string): string {
  const [datePart] = dateTime.split("T");
  return datePart.replace(/-/g, "");
}

/** Convert datetime-local "YYYY-MM-DDTHH:mm" → "HH:MM" */
export function formatTimeForMonitor(dateTime: string): string {
  const [, timePart] = dateTime.split("T");
  return timePart ?? "";
}

// --- API client ---

/** NFR-SM1: Fetch stop monitor departures/arrivals for a given stop and time window. */
export async function fetchStopMonitor(
  params: StopMonitorRequestParams,
  options?: { baseUrl?: string; apiKey?: string },
  signal?: AbortSignal
): Promise<StopMonitorResult> {
  const { stopId, date, time, minutes = 60, arrOnly, depOnly } = params;

  const resolvedBaseUrl = options?.baseUrl ?? "";
  const resolvedApiKey = options?.apiKey ?? "";

  const queryParams = new URLSearchParams();
  queryParams.set("stopid", stopId);
  queryParams.set("date", date);
  queryParams.set("time", time);
  queryParams.set("minutes", String(minutes));
  if (arrOnly) queryParams.set("arrOnly", "true");
  if (depOnly) queryParams.set("depOnly", "true");

  const url = `${resolvedBaseUrl}/monitor?${queryParams}`;

  // NFR-SM1.3: Log request
  console.log("[StopMonitor API] Request:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "X-API-Key": resolvedApiKey },
    });

    // NFR-SM1.3: Log response status
    console.log("[StopMonitor API] Response status:", response.status);

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

    let data: MonitorItem[];
    try {
      const raw = await response.json();
      // NFR-SM1.3: Log response
      console.log("[StopMonitor API] Response:", raw);
      if (!Array.isArray(raw)) {
        console.error("[StopMonitor API] Unexpected response format (expected array):", raw);
        return {
          success: false,
          error: { type: "parse", message: `Expected array, got: ${JSON.stringify(raw).slice(0, 120)}` },
        };
      }
      data = raw;
    } catch {
      return {
        success: false,
        error: { type: "parse", message: "Failed to parse API response as JSON" },
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

/** Fetch all stops within a map bounding box. Returns empty array on any error. */
export async function fetchStops(
  bb: { lon1: number; lat1: number; lon2: number; lat2: number },
  options?: { baseUrl?: string; apiKey?: string },
  signal?: AbortSignal
): Promise<StopsItem[]> {
  const resolvedBaseUrl = options?.baseUrl ?? "";
  const resolvedApiKey = options?.apiKey ?? "";

  // API expects lat1,lon1,lat2,lon2 (per example in docs: "51.1,12.5,51.3,12.9")
  const url = `${resolvedBaseUrl}/stops?bb=${bb.lat1},${bb.lon1},${bb.lat2},${bb.lon2}&maxlen=150`;
  console.log("[StopMonitor API] Stops request:", url);

  try {
    const response = await fetch(url, {
      headers: { "X-API-Key": resolvedApiKey },
      signal,
    });
    console.log("[StopMonitor API] Stops response:", response.status);
    if (!response.ok) return [];
    const raw = await response.json();
    if (!Array.isArray(raw)) return [];
    return raw as StopsItem[];
  } catch {
    return [];
  }
}
