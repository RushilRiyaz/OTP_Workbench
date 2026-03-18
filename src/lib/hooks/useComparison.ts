import { useState, useCallback, useMemo } from "react";
import type {
  LocationValue,
  RoutingOptions,
  Environment,
  ValidationError,
  ComparisonItineraryRef,
  DetailHoveredLeg,
  ComparisonMapItinerary,
  ComparisonResultMap,
} from "@/lib/types";
import { ENV_COLORS, ITINERARY_COLORS, getEnvironmentConfig } from "@/lib/types";
import { fetchRouting } from "@/lib/api/routing";
import type { RoutingResponse, RoutingError } from "@/lib/api/routing";
import { validateRoutingParams } from "@/lib/utils/validation";
import { toggleComparisonSelection } from "@/lib/utils/comparisonSelectionUtils";
import { fetchInsaRouting } from "@/lib/insa";

interface UseComparisonParams {
  selectedEnvironments: string[];
  customEnvironments: Environment[];
  routingFormState: {
    startLocation: LocationValue;
    destinationLocation: LocationValue;
    dateTime: string;
    routingOptions: RoutingOptions;
  };
}

export function useComparison({
  selectedEnvironments,
  customEnvironments,
  routingFormState,
}: UseComparisonParams) {
  const [comparisonResults, setComparisonResults] = useState<ComparisonResultMap>({});
  const [comparisonHoveredItinerary, setComparisonHoveredItinerary] = useState<{
    envId: string;
    itineraryIndex: number;
  } | null>(null);
  const [comparisonHoveredLegIndex, setComparisonHoveredLegIndex] = useState<number | null>(null);
  const [comparisonSelectedItineraries, setComparisonSelectedItineraries] = useState<
    ComparisonItineraryRef[]
  >([]);
  const [detailHoveredLeg, setDetailHoveredLeg] = useState<DetailHoveredLeg | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Own loading/validation state (separate from routing)
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // --- Derived ---

  const isDetailComparisonView = showDetailView && comparisonSelectedItineraries.length > 0;

  const comparisonMapItineraries = useMemo((): ComparisonMapItinerary[] => {
    if (isDetailComparisonView) {
      const items: ComparisonMapItinerary[] = [];
      for (let i = 0; i < comparisonSelectedItineraries.length; i++) {
        const ref = comparisonSelectedItineraries[i];
        const it =
          comparisonResults[ref.envId]?.result?.plan?.itineraries?.[ref.itineraryIndex];
        if (it) items.push({ itinerary: it, color: ITINERARY_COLORS[i] ?? "#888" });
      }
      return items;
    }
    if (comparisonHoveredItinerary) {
      const it =
        comparisonResults[comparisonHoveredItinerary.envId]?.result?.plan?.itineraries?.[
          comparisonHoveredItinerary.itineraryIndex
        ];
      if (it) {
        const envIndex = selectedEnvironments.indexOf(comparisonHoveredItinerary.envId);
        return [{ itinerary: it, color: ENV_COLORS[envIndex] ?? "#888" }];
      }
    }
    return [];
  }, [
    isDetailComparisonView,
    comparisonSelectedItineraries,
    comparisonHoveredItinerary,
    comparisonResults,
    selectedEnvironments,
  ]);

  // --- Handlers ---

  const handleComparisonSubmit = useCallback(async () => {
    setValidationErrors([]);
    const { startLocation, destinationLocation, dateTime, routingOptions } = routingFormState;

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
    if (selectedEnvironments.length === 0) return;

    setComparisonSelectedItineraries([]);
    setShowDetailView(false);
    setDetailHoveredLeg(null);

    const initialState: ComparisonResultMap = {};
    for (const envId of selectedEnvironments) {
      initialState[envId] = { result: null, error: null, isLoading: true };
    }
    setComparisonResults(initialState);
    setIsLoading(true);

    const routingParams = {
      start: startLocation,
      destination: destinationLocation,
      dateTime,
      routingOptions,
    };

    const promises = selectedEnvironments.map(async (envId) => {
      try {
        const result =
          envId === "insa"
            ? await fetchInsaRouting(routingParams)
            : await fetchRouting(routingParams, undefined, {
                baseUrl: getEnvironmentConfig(envId, customEnvironments).otpUrl,
                apiKey: getEnvironmentConfig(envId, customEnvironments).apiKey,
              });
        return { envId, result };
      } catch (err) {
        console.error(`[Comparison] Unexpected error for ${envId}:`, err);
        const error: RoutingError = {
          type: "network",
          message: err instanceof Error ? err.message : "Unexpected error",
        };
        return { envId, result: { success: false as const, error } };
      }
    });

    const results = await Promise.all(promises);
    const nextState: ComparisonResultMap = {};
    for (const { envId, result } of results) {
      if (result.success) {
        nextState[envId] = { result: result.data, error: null, isLoading: false };
      } else {
        nextState[envId] = { result: null, error: result.error, isLoading: false };
      }
    }
    setComparisonResults(nextState);
    setIsLoading(false);
  }, [routingFormState, selectedEnvironments, customEnvironments]);

  const handleComparisonHover = useCallback(
    (envId: string, itineraryIndex: number | null) => {
      if (itineraryIndex === null) {
        setComparisonHoveredItinerary(null);
      } else {
        setComparisonHoveredItinerary({ envId, itineraryIndex });
      }
      setComparisonHoveredLegIndex(null);
    },
    []
  );

  const handleComparisonToggleSelect = useCallback(
    (envId: string, itineraryIndex: number) => {
      setComparisonSelectedItineraries((prev) =>
        toggleComparisonSelection(prev, envId, itineraryIndex)
      );
      setDetailHoveredLeg(null);
      setComparisonHoveredLegIndex(null);
    },
    []
  );

  const handleEnterDetailView = useCallback(() => {
    setShowDetailView(true);
  }, []);

  const handleExitDetailView = useCallback(() => {
    setShowDetailView(false);
    setDetailHoveredLeg(null);
  }, []);

  const handleDetailHoverLeg = useCallback((leg: DetailHoveredLeg | null) => {
    setDetailHoveredLeg(leg);
  }, []);

  const clearComparisonState = useCallback(() => {
    setComparisonResults({});
    setComparisonHoveredItinerary(null);
    setComparisonSelectedItineraries([]);
    setShowDetailView(false);
    setDetailHoveredLeg(null);
    setComparisonHoveredLegIndex(null);
    setValidationErrors([]);
    setIsLoading(false);
  }, []);

  return {
    // State
    comparisonResults,
    setComparisonResults,
    comparisonHoveredItinerary,
    setComparisonHoveredItinerary,
    comparisonHoveredLegIndex,
    setComparisonHoveredLegIndex,
    comparisonSelectedItineraries,
    setComparisonSelectedItineraries,
    detailHoveredLeg,
    setDetailHoveredLeg,
    showDetailView,
    setShowDetailView,
    isLoading,
    setIsLoading,
    validationErrors,
    setValidationErrors,

    // Derived
    isDetailComparisonView,
    comparisonMapItineraries,

    // Handlers
    handleComparisonSubmit,
    handleComparisonHover,
    handleComparisonToggleSelect,
    handleEnterDetailView,
    handleExitDetailView,
    handleDetailHoverLeg,
    clearComparisonState,
  };
}
