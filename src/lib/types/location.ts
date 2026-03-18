import type { AutocompleteResult } from "@/lib/autocomplete";

export interface LocationValue {
  text: string;
  type: "autocomplete" | "stopId" | "coordinates" | null;
  location: AutocompleteResult | null;
  stopId: string | null;
  coordinates: { lat: number; lon: number } | null;
}

export const emptyLocationValue: LocationValue = {
  text: "",
  type: null,
  location: null,
  stopId: null,
  coordinates: null,
};
