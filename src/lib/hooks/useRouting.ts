import { useState, useCallback, useEffect } from "react";
import type {
  LocationValue,
  RoutingOptions,
  ValidationError,
  RequestHistoryEntry,
} from "@/lib/types";
import { emptyLocationValue, defaultRoutingOptions } from "@/lib/types";
import {
  fetchRouting,
  type RoutingResponse,
  type RoutingError,
  type Itinerary,
} from "@/lib/api/routing";
import { validateRoutingParams } from "@/lib/utils/validation";
import {
  getRequestHistory,
  addToRequestHistory,
  clearRequestHistory,
  generateDisplayLabel,
} from "@/lib/state/requestHistory";
import { getBerlinNow } from "@/components/routing/DateTimeInput";
import { fetchInsaRouting, type InsaTripResponse } from "@/lib/insa";

interface UseRoutingParams {
  getEnvConfig: () => { envId: string; otpUrl: string; apiKey: string };
  selectedAutocompleteEnv: string;
}

export function useRouting({
  getEnvConfig,
  selectedAutocompleteEnv,
}: UseRoutingParams) {
  const [startLocation, setStartLocation] =
    useState<LocationValue>(emptyLocationValue);
  const [destinationLocation, setDestinationLocation] =
    useState<LocationValue>(emptyLocationValue);
  const [dateTime, setDateTime] = useState<string>(() => {
    const now = new Date();
    const berlinStr = now.toLocaleString("sv-SE", {
      timeZone: "Europe/Berlin",
    });
    return berlinStr.slice(0, 16).replace(" ", "T");
  });
  const [routingOptions, setRoutingOptions] =
    useState<RoutingOptions>(defaultRoutingOptions);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [routingResult, setRoutingResult] = useState<RoutingResponse | null>(
    null
  );
  const [routingError, setRoutingError] = useState<RoutingError | null>(null);
  const [selectedItineraryIndex, setSelectedItineraryIndex] =
    useState<number>(0);
  const [hoveredLegIndex, setHoveredLegIndex] = useState<number | null>(null);
  const [requestHistory, setRequestHistory] = useState<RequestHistoryEntry[]>(
    []
  );

  // Load history on mount
  useEffect(() => {
    setRequestHistory(getRequestHistory());
  }, []);

  const handleSelectItinerary = useCallback((index: number) => {
    setSelectedItineraryIndex(index);
    setHoveredLegIndex(null);
  }, []);

  const handleSubmitRouting = async () => {
    setValidationErrors([]);
    setRoutingError(null);
    const errors = validateRoutingParams({
      start: startLocation,
      destination: destinationLocation,
      dateTime,
      routingOptions,
    });
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setIsLoading(true);
    setRoutingResult(null);
    try {
      const { envId, otpUrl, apiKey } = getEnvConfig();
      const routingParams = {
        start: startLocation,
        destination: destinationLocation,
        dateTime,
        routingOptions,
      };
      const result =
        envId === "insa"
          ? await fetchInsaRouting(routingParams)
          : await fetchRouting(routingParams, undefined, {
              baseUrl: otpUrl,
              apiKey,
            });
      if (result.success) {
        setRoutingResult(result.data);
        setSelectedItineraryIndex(0);
        const historyEntry: RequestHistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          start: startLocation,
          destination: destinationLocation,
          dateTime,
          routingOptions,
          selectedEnvironment: envId,
          selectedAutocompleteEnv,
          displayLabel: generateDisplayLabel(startLocation, destinationLocation),
        };
        addToRequestHistory(historyEntry);
        setRequestHistory(getRequestHistory());
      } else {
        setRoutingError(result.error);
        console.error("[Routing] Error:", result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = useCallback(
    async (direction: "earlier" | "later") => {
      if (!routingResult?.plan?.itineraries?.length) return;
      const itineraries = routingResult.plan.itineraries;
      const { envId, otpUrl, apiKey } = getEnvConfig();

      let result;
      if (envId === "insa") {
        const rawResponse = routingResult._rawApiResponse as
          | InsaTripResponse
          | undefined;
        const token =
          direction === "earlier" ? rawResponse?.scrB : rawResponse?.scrF;
        if (!token) return;
        result = await fetchInsaRouting(
          {
            start: startLocation,
            destination: destinationLocation,
            dateTime,
            routingOptions,
          },
          undefined,
          { context: token }
        );
      } else {
        const refItinerary =
          direction === "earlier"
            ? itineraries[0]
            : itineraries[itineraries.length - 1];
        const refTime =
          direction === "earlier"
            ? refItinerary.startTime
            : refItinerary.endTime;
        const shiftedDate = new Date(
          refTime + (direction === "later" ? 60000 : -60000)
        );
        const berlinStr = shiftedDate.toLocaleString("sv-SE", {
          timeZone: "Europe/Berlin",
        });
        const adjustedDateTime = berlinStr.slice(0, 16).replace(" ", "T");
        const modifiedOptions =
          direction === "earlier"
            ? { ...routingOptions, timingMode: "arriveBy" as const }
            : { ...routingOptions, timingMode: "departAt" as const };
        result = await fetchRouting(
          {
            start: startLocation,
            destination: destinationLocation,
            dateTime: adjustedDateTime,
            routingOptions: modifiedOptions,
          },
          undefined,
          { baseUrl: otpUrl, apiKey }
        );
      }

      if (!result.success || !result.data.plan?.itineraries?.length) return;
      const newItineraries = result.data.plan.itineraries;
      const existingKeys = new Set(
        itineraries.map(
          (it: Itinerary) => `${it.startTime}-${it.endTime}`
        )
      );
      const unique = newItineraries.filter(
        (it: Itinerary) => !existingKeys.has(`${it.startTime}-${it.endTime}`)
      );
      if (unique.length === 0) return;
      const merged = [...itineraries, ...unique].sort(
        (a, b) => a.startTime - b.startTime
      );
      const capped =
        direction === "later" ? merged.slice(-20) : merged.slice(0, 20);
      setRoutingResult({
        ...routingResult,
        plan: { ...routingResult.plan!, itineraries: capped },
        ...(envId === "insa" && result.data._rawApiResponse
          ? {
              _rawApiResponse: {
                ...((routingResult._rawApiResponse as Record<
                  string,
                  unknown
                >) || {}),
                ...(direction === "earlier"
                  ? {
                      scrB: (result.data._rawApiResponse as InsaTripResponse)
                        .scrB,
                    }
                  : {
                      scrF: (result.data._rawApiResponse as InsaTripResponse)
                        .scrF,
                    }),
              },
            }
          : {}),
      });
      if (direction === "earlier") {
        const offset = capped.length - itineraries.length;
        setSelectedItineraryIndex((prev) =>
          Math.min(prev + offset, capped.length - 1)
        );
      }
    },
    [
      routingResult,
      startLocation,
      destinationLocation,
      dateTime,
      routingOptions,
      getEnvConfig,
    ]
  );

  const handleClearHistory = () => {
    clearRequestHistory();
    setRequestHistory([]);
  };

  const clearRoutingState = useCallback(() => {
    setRoutingResult(null);
    setSelectedItineraryIndex(0);
    setHoveredLegIndex(null);
    setStartLocation(emptyLocationValue);
    setDestinationLocation(emptyLocationValue);
    setDateTime(getBerlinNow());
    setRoutingError(null);
    setValidationErrors([]);
  }, []);

  const setFormFromHistory = useCallback((entry: RequestHistoryEntry) => {
    setStartLocation(entry.start);
    setDestinationLocation(entry.destination);
    setDateTime(entry.dateTime);
    setRoutingOptions(entry.routingOptions);
    setValidationErrors([]);
    setRoutingError(null);
    setRoutingResult(null);
  }, []);

  return {
    // State
    startLocation,
    setStartLocation,
    destinationLocation,
    setDestinationLocation,
    dateTime,
    setDateTime,
    routingOptions,
    setRoutingOptions,
    isLoading,
    validationErrors,
    setValidationErrors,
    routingResult,
    setRoutingResult,
    routingError,
    setRoutingError,
    selectedItineraryIndex,
    setSelectedItineraryIndex,
    hoveredLegIndex,
    setHoveredLegIndex,
    requestHistory,

    // Handlers
    handleSelectItinerary,
    handleSubmitRouting,
    handleLoadMore,
    handleClearHistory,
    clearRoutingState,
    setFormFromHistory,
  };
}
