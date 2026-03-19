// Resolve an OTP stop ID to stop name + coordinates via the Stop Monitor /stops API

const STOP_MONITOR_URL = process.env.NEXT_PUBLIC_STOPMONITOR_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_STOPMONITOR_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";
const TIMEOUT_MS = 5000;

// Leipzig metro area bounding box (generous)
const BOUNDING_BOX = "51.0,12.0,51.6,12.8";

interface StopInfo {
  stop_name: string;
  stop_id: string;
  lat: number;
  lon: number;
  priority: number;
}

export async function lookupStopById(
  stopId: string
): Promise<{ name: string; lat: number; lon: number } | null> {
  if (!STOP_MONITOR_URL) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${STOP_MONITOR_URL}/stops?bb=${BOUNDING_BOX}&maxlen=5000`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "X-API-Key": API_KEY },
    });

    if (!response.ok) return null;

    const stops: StopInfo[] = await response.json();

    // Strip OTP feed prefix (e.g. "1:1000104" → "1000104")
    const numericId = stopId.includes(":") ? stopId.split(":").pop()! : stopId;

    const match = stops.find((s) => s.stop_id === numericId);
    if (!match) return null;

    return { name: match.stop_name, lat: match.lat, lon: match.lon };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
