const API_BASE_URL = process.env.NEXT_PUBLIC_AUTOCOMPLETE_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_AUTOCOMPLETE_API_KEY || "";

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
}

export async function searchLocations(params: SearchParams): Promise<AutocompleteResult[]> {
  const { search, size = 10, center = "51.3,12.6", pointType = "P,S,W,N" } = params;

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

  const response = await fetch(`${API_BASE_URL}/search?${queryParams}`, {
    method: "GET",
    headers: {
      "X-API-Key": API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Autocomplete API error: ${response.status}`);
  }

  const data = await response.json();
  return data as AutocompleteResult[];
}
