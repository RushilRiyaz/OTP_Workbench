// Reverse geocode coordinates to a human-readable address via Nominatim

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const TIMEOUT_MS = 5000;

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=0`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "OTPClientV2" },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.display_name ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
