import { useState, useCallback, useEffect } from "react";
import {
  type NearbySearchFormState,
  defaultNearbySearchFormState,
  toNearbySearchParams,
} from "@/components/nearby-search/NearbySearchForm";
import { fetchNearbySearch, type NearbySearchItem } from "@/lib/api/nearbySearch";

interface UseNearbySearchParams {
  getApiKey: () => string;
}

export function useNearbySearch({ getApiKey }: UseNearbySearchParams) {
  const [nearbySearchFormState, setNearbySearchFormState] =
    useState<NearbySearchFormState>(defaultNearbySearchFormState);
  const [nearbySearchResults, setNearbySearchResults] =
    useState<NearbySearchItem[] | null>(null);
  const [nearbySearchLoading, setNearbySearchLoading] = useState(false);
  const [nearbySearchError, setNearbySearchError] = useState<string | null>(null);
  const [nearbySearchSelectedItem, setNearbySearchSelectedItem] =
    useState<NearbySearchItem | null>(null);

  useEffect(() => {
    if (!nearbySearchFormState.center) {
      setNearbySearchResults(null);
      setNearbySearchSelectedItem(null);
      setNearbySearchError(null);
    }
  }, [nearbySearchFormState.center]);

  const handleNearbySearchCenterChange = useCallback(
    (center: { lat: number; lon: number }) => {
      setNearbySearchFormState((prev) => ({ ...prev, center }));
      setNearbySearchResults(null);
      setNearbySearchSelectedItem(null);
      setNearbySearchError(null);
    },
    [],
  );

  const handleNearbySearchRadiusChange = useCallback((radius: number) => {
    setNearbySearchFormState((prev) => ({ ...prev, radius }));
  }, []);

  const handleNearbySearchSubmit = useCallback(async () => {
    const params = toNearbySearchParams(nearbySearchFormState);
    if (!params) return;
    setNearbySearchLoading(true);
    setNearbySearchError(null);
    setNearbySearchSelectedItem(null);
    const apiKey = getApiKey();
    const result = await fetchNearbySearch(params, undefined, {
      baseUrl: process.env.NEXT_PUBLIC_NEARBYSEARCH_API_URL || "",
      apiKey,
    });
    if (result.success) {
      setNearbySearchResults(result.data);
    } else {
      setNearbySearchError(result.error.message);
      console.error("[NearbySearch] Error:", result.error);
    }
    setNearbySearchLoading(false);
  }, [nearbySearchFormState, getApiKey]);

  return {
    nearbySearchFormState,
    setNearbySearchFormState,
    nearbySearchResults,
    setNearbySearchResults,
    nearbySearchLoading,
    nearbySearchError,
    nearbySearchSelectedItem,
    setNearbySearchSelectedItem,
    handleNearbySearchCenterChange,
    handleNearbySearchRadiusChange,
    handleNearbySearchSubmit,
  };
}
