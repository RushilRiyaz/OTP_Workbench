import type { LocationValue } from "@/lib/types";

// Extract lat/lng from LocationValue
// Handles autocomplete results (location.lat/lon) and direct coordinates
// Returns null for stopId type — coords unavailable until API lookup
export function getCoords(
  loc: LocationValue | null
): { lat: number; lng: number } | null {
  if (!loc) return null;

  // Direct coordinates input
  if (loc.coordinates) {
    return { lat: loc.coordinates.lat, lng: loc.coordinates.lon };
  }

  // Autocomplete result with lat/lon
  if (loc.location?.lat !== undefined && loc.location?.lon !== undefined) {
    return { lat: loc.location.lat, lng: loc.location.lon };
  }

  return null;
}
