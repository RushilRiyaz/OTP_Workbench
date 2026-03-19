// INSA utility functions: parsing, mode mapping, polyline decoding

import type { TransitMode } from "../api/routing";

// ---------------------------------------------------------------------------
// Date/Time Parsing
// ---------------------------------------------------------------------------

/** Parse INSA date ("YYYY-MM-DD") + time ("HH:mm:ss") → epoch ms */
export function parseInsaDateTime(date: string, time: string, tz?: number): number {
  const [h, m, s] = time.split(":").map(Number);
  const isoDate = `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s || 0).padStart(2, "0")}`;

  if (tz !== undefined) {
    const sign = tz >= 0 ? "+" : "-";
    const absMinutes = Math.abs(tz);
    const tzH = String(Math.floor(absMinutes / 60)).padStart(2, "0");
    const tzM = String(absMinutes % 60).padStart(2, "0");
    return new Date(`${isoDate}${sign}${tzH}:${tzM}`).getTime();
  }

  // Fallback: parse in Berlin timezone (handles CET/CEST automatically)
  // Use sv-SE locale for consistent YYYY-MM-DD HH:mm:ss format
  const asUtc = new Date(`${isoDate}Z`).getTime();
  const utcStr = new Date(asUtc).toLocaleString("sv-SE", { timeZone: "UTC" });
  const berlinStr = new Date(asUtc).toLocaleString("sv-SE", { timeZone: "Europe/Berlin" });
  // Both parsed in local TZ, so the difference = Berlin-UTC offset
  const offsetMs = new Date(berlinStr).getTime() - new Date(utcStr).getTime();
  return asUtc - offsetMs;
}

/** Parse ISO 8601 duration ("PT1H37M", "PT3M", "P1DT2H") → milliseconds */
export function parseIsoDuration(duration: string): number {
  const match = duration.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseInt(match[4] || "0", 10);
  return ((days * 24 + hours) * 3600 + minutes * 60 + seconds) * 1000;
}

/** Format epoch ms → "HH:mm" string (Berlin timezone) */
export function formatTimeHHMM(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleTimeString("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Format duration ms → "Xh Ymin" string */
export function formatDurationHHMM(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ---------------------------------------------------------------------------
// Travel Mode → INSA Products Bitmask
// ---------------------------------------------------------------------------

const MODE_TO_PRODUCT: Record<string, number> = {
  TRANSIT: 127,
  BUS: 64,
  TRAM: 32,
  SUBURB: 16,
  TRAIN: 8,
  ICE: 1,
  IC: 2,
  RE: 8,
  RRB: 8,
};

/** Convert OTP travel mode IDs → INSA products bitmask (OR combined) */
export function travelModesToProducts(modes: string[]): number {
  let products = 0;
  for (const mode of modes) {
    const bit = MODE_TO_PRODUCT[mode];
    if (bit !== undefined) {
      products |= bit;
    }
  }
  // FR24.4: default to all if nothing matched
  return products || 127;
}

// ---------------------------------------------------------------------------
// INSA Category → OTP Mode
// ---------------------------------------------------------------------------

/** Map INSA Product.catOut/catCode → OTP TransitMode */
export function insaCategoryToOtpMode(catOut: string, catCode: string): TransitMode {
  const cat = catOut.trim();
  switch (cat) {
    case "Bus":
      return "BUS";
    case "Tram":
    case "STR":
    case "Str":
      return "TRAM";
    case "S":
      return "SUBURB";
    case "RE":
    case "RB":
    case "Train":
    case "ICE":
    case "IC":
    case "EC":
      return "TRAIN";
    default:
      break;
  }
  // Fallback by catCode
  switch (catCode) {
    case "0":
    case "1":
    case "2":
    case "3":
      return "TRAIN";
    case "4":
      return "SUBURB";
    case "5":
      return "TRAM";
    case "6":
      return "BUS";
    default:
      return "BUS";
  }
}

// ---------------------------------------------------------------------------
// Google Polyline Algorithm Decoder
// ---------------------------------------------------------------------------

/** Decode a Google Polyline Algorithm encoded string → {lat, lon}[] */
export function decodeGooglePolyline(encoded: string): Array<{ lat: number; lon: number }> {
  const points: Array<{ lat: number; lon: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lon: lng / 1e5 });
  }

  return points;
}
