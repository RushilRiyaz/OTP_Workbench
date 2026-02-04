const API_BASE_URL = process.env.NEXT_PUBLIC_AUTOCOMPLETE_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export interface AutocompleteResult {
  id: string;
  name: string;
  data: string;
  lat: number;
  lon: number;
  ptype: string;
  stadt: string | null;
  stadtteil: string | null;
  postalcode: string | null;
  landkreis: string | null;
  streetname: string | null;
  housenumber: string | null;
  tags: Record<string, unknown> | null;
}

interface SearchParams {
  search: string;
  size?: number;
  center?: string;
  pointType?: string;
  signal?: AbortSignal;
}

const REQUEST_TIMEOUT_MS = 5000;

export async function searchLocations(params: SearchParams): Promise<AutocompleteResult[]> {
  const { search, size = 10, center = "51.3,12.6", pointType = "P,S,W,V,N", signal } = params;
  

  if (!search || search.length < 2) {
    return [];
  }

  const queryParams = new URLSearchParams({
    search,
    format: "JSON",
    size: size.toString(),
    center,
    pointType,
  });

  // Internal controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // If external signal aborts, abort internal controller too
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(`${API_BASE_URL}/search?${queryParams}`, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Autocomplete API error: ${response.status}`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      console.error("Failed to parse autocomplete response as JSON");
      return [];
    }

    if (!Array.isArray(data)) {
      console.error("Unexpected autocomplete response format:", data);
      return [];
    }

    return data as AutocompleteResult[];
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
