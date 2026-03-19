import { useState, useEffect, useRef, useCallback } from "react";
import type { LocationValue, RoutingOptions, Environment } from "@/lib/types";
import { serializeFormState, deserializeUrlParams } from "@/lib/state/urlParams";

interface UseUrlStateSyncParams {
  routingState: {
    startLocation: LocationValue;
    destinationLocation: LocationValue;
    dateTime: string;
    routingOptions: RoutingOptions;
  };
  envState: {
    selectedEnvironments: string[];
    selectedAutocompleteEnv: string;
    customEnvironments: Environment[];
  };
  setters: {
    setStartLocation: (v: LocationValue) => void;
    setDestinationLocation: (v: LocationValue) => void;
    setDateTime: (v: string) => void;
    setRoutingOptions: (v: RoutingOptions) => void;
    setSelectedEnvironments: (ids: string[]) => void;
    setSelectedAutocompleteEnv: (id: string) => void;
    setCustomEnvironments: (envs: Environment[]) => void;
  };
}

export function useUrlStateSync({
  routingState,
  envState,
  setters,
}: UseUrlStateSyncParams) {
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [linkCopied, setLinkCopied] = useState<"success" | "error" | null>(
    null,
  );
  const urlUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Read URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.toString()) {
      const parsed = deserializeUrlParams(searchParams);
      if (parsed.start) setters.setStartLocation(parsed.start);
      if (parsed.destination)
        setters.setDestinationLocation(parsed.destination);
      if (parsed.dateTime) setters.setDateTime(parsed.dateTime);
      if (parsed.routingOptions)
        setters.setRoutingOptions(parsed.routingOptions);
      if (parsed.selectedEnvironment)
        setters.setSelectedEnvironments([parsed.selectedEnvironment]);
      if (parsed.selectedAutocompleteEnv)
        setters.setSelectedAutocompleteEnv(parsed.selectedAutocompleteEnv);
      if (parsed.customEnvironments)
        setters.setCustomEnvironments(parsed.customEnvironments);
    }
    setUrlInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced URL write
  useEffect(() => {
    if (!urlInitialized) return;
    if (typeof window === "undefined") return;

    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const queryString = serializeFormState({
        start: routingState.startLocation,
        destination: routingState.destinationLocation,
        dateTime: routingState.dateTime,
        routingOptions: routingState.routingOptions,
        selectedEnvironment: envState.selectedEnvironments[0] || "prod",
        selectedAutocompleteEnv: envState.selectedAutocompleteEnv,
        customEnvironments: envState.customEnvironments,
      });
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }, 300);

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [
    urlInitialized,
    routingState.startLocation,
    routingState.destinationLocation,
    routingState.dateTime,
    routingState.routingOptions,
    envState.selectedEnvironments,
    envState.selectedAutocompleteEnv,
    envState.customEnvironments,
  ]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied("success");
      setTimeout(() => setLinkCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      setLinkCopied("error");
      setTimeout(() => setLinkCopied(null), 2000);
    }
  }, []);

  return { linkCopied, handleCopyLink };
}
