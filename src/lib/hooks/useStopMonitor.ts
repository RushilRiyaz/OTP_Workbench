import { useState, useCallback, useMemo } from "react";
import type { LocationValue, ValidationError, Environment } from "@/lib/types";
import { emptyLocationValue, getStopMonitorConfig } from "@/lib/types";
import {
  fetchStopMonitor,
  formatDateForMonitor,
  formatTimeForMonitor,
} from "@/lib/api/stopMonitor";
import type { StopMonitorEnvState, StopsItem } from "@/lib/api/stopMonitor";
import { validateStopMonitorParams } from "@/lib/utils/validation";
import { getBerlinNow } from "@/components/routing/DateTimeInput";

function getStopIdForMonitor(stop: LocationValue): string {
  if (stop.type === "stopId" && stop.stopId) {
    const id = stop.stopId.trim();
    return id.endsWith("_parent") ? id : `${id}_parent`;
  }
  if (stop.type === "autocomplete" && stop.location) {
    const loc = stop.location;
    if (loc.ptype === "S") {
      const tagStopId = loc.tags?.stop_id;
      if (tagStopId) {
        const id = String(tagStopId);
        return id.endsWith("_parent") ? id : `${id}_parent`;
      }
      const parts = loc.id?.split("|");
      if (parts && parts.length >= 2 && parts[1]) {
        return `${parts[1]}_parent`;
      }
    }
    return `koord=${loc.lat},${loc.lon}`;
  }
  if (stop.type === "coordinates" && stop.coordinates) {
    return `koord=${stop.coordinates.lat},${stop.coordinates.lon}`;
  }
  return "";
}

interface UseStopMonitorParams {
  customEnvironments: Environment[];
}

export function useStopMonitor({ customEnvironments }: UseStopMonitorParams) {
  const [smStop, setSmStop] = useState<LocationValue>(emptyLocationValue);
  const [smDateTime, setSmDateTime] = useState<string>(() => getBerlinNow());
  const [smArrOnly, setSmArrOnly] = useState(false);
  const [smDepOnly, setSmDepOnly] = useState(false);
  const [smSelectedEnvs, setSmSelectedEnvs] = useState<string[]>(["prod"]);
  const [smValidationErrors, setSmValidationErrors] = useState<
    ValidationError[]
  >([]);
  const [smResults, setSmResults] = useState<
    Record<string, StopMonitorEnvState>
  >({});

  const smIsLoading = smSelectedEnvs.some((id) => smResults[id]?.isLoading);

  const smMapConfig = useMemo(() => {
    if (smSelectedEnvs.length === 0)
      return { stopMonitorUrl: "", apiKey: "" };
    return getStopMonitorConfig(smSelectedEnvs[0], customEnvironments);
  }, [smSelectedEnvs, customEnvironments]);

  const smSelectedStopId =
    smStop.type === "stopId" ? smStop.stopId : null;

  const handleStopMonitorSubmit = useCallback(async () => {
    setSmValidationErrors([]);
    const errors = validateStopMonitorParams({
      stop: smStop,
      dateTime: smDateTime,
    });
    if (errors.length > 0) {
      setSmValidationErrors(errors);
      return;
    }
    const stopId = getStopIdForMonitor(smStop);
    if (!stopId) return;
    const date = formatDateForMonitor(smDateTime);
    const time = formatTimeForMonitor(smDateTime);
    const initialState: Record<string, StopMonitorEnvState> = {};
    for (const envId of smSelectedEnvs) {
      initialState[envId] = {
        data: null,
        error: null,
        isLoading: true,
        isLoadingMore: false,
        minutes: 60,
      };
    }
    setSmResults(initialState);
    const promises = smSelectedEnvs.map(async (envId) => {
      try {
        const { stopMonitorUrl, apiKey } = getStopMonitorConfig(
          envId,
          customEnvironments,
        );
        const result = await fetchStopMonitor(
          {
            stopId,
            date,
            time,
            minutes: 60,
            arrOnly: smArrOnly || undefined,
            depOnly: smDepOnly || undefined,
          },
          { baseUrl: stopMonitorUrl, apiKey },
        );
        return { envId, result };
      } catch (err) {
        console.error(
          `[StopMonitor] Unexpected error for ${envId}:`,
          err,
        );
        return {
          envId,
          result: {
            success: false as const,
            error: {
              type: "network" as const,
              message:
                err instanceof Error ? err.message : "Unexpected error",
            },
          },
        };
      }
    });
    const settled = await Promise.all(promises);
    const nextState: Record<string, StopMonitorEnvState> = {};
    for (const { envId, result } of settled) {
      if (result.success) {
        nextState[envId] = {
          data: result.data,
          error: null,
          isLoading: false,
          isLoadingMore: false,
          minutes: 60,
        };
      } else {
        nextState[envId] = {
          data: null,
          error: result.error,
          isLoading: false,
          isLoadingMore: false,
          minutes: 60,
        };
      }
    }
    setSmResults(nextState);
  }, [smStop, smDateTime, smArrOnly, smDepOnly, smSelectedEnvs, customEnvironments]);

  const handleStopMonitorMore = useCallback(
    async (envId: string) => {
      const current = smResults[envId];
      if (!current || current.isLoading || current.isLoadingMore) return;
      const stopId = getStopIdForMonitor(smStop);
      if (!stopId) return;
      const newMinutes = current.minutes + 60;
      setSmResults((prev) => ({
        ...prev,
        [envId]: { ...prev[envId], isLoadingMore: true },
      }));
      try {
        const { stopMonitorUrl, apiKey } = getStopMonitorConfig(
          envId,
          customEnvironments,
        );
        const result = await fetchStopMonitor(
          {
            stopId,
            date: formatDateForMonitor(smDateTime),
            time: formatTimeForMonitor(smDateTime),
            minutes: newMinutes,
            arrOnly: smArrOnly || undefined,
            depOnly: smDepOnly || undefined,
          },
          { baseUrl: stopMonitorUrl, apiKey },
        );
        if (result.success) {
          const existingKeys = new Set(
            (current.data ?? []).map(
              (item) => `${item.trip_id}|${item.stop_id}`,
            ),
          );
          const newItems = result.data.filter(
            (item) =>
              !existingKeys.has(`${item.trip_id}|${item.stop_id}`),
          );
          setSmResults((prev) => ({
            ...prev,
            [envId]: {
              ...prev[envId],
              data: [...(current.data ?? []), ...newItems],
              isLoadingMore: false,
              minutes: newMinutes,
            },
          }));
        } else {
          setSmResults((prev) => ({
            ...prev,
            [envId]: { ...prev[envId], isLoadingMore: false },
          }));
        }
      } catch {
        setSmResults((prev) => ({
          ...prev,
          [envId]: { ...prev[envId], isLoadingMore: false },
        }));
      }
    },
    [smResults, smStop, smDateTime, smArrOnly, smDepOnly, customEnvironments],
  );

  const handleSmStopSelect = useCallback((stop: StopsItem) => {
    setSmStop({
      text: stop.stop_name,
      type: "stopId",
      location: null,
      stopId: stop.stop_id,
      coordinates: { lat: stop.lat, lon: stop.lon },
    });
  }, []);

  const handleSmClear = useCallback(() => {
    setSmStop(emptyLocationValue);
    setSmDateTime(getBerlinNow());
    setSmArrOnly(false);
    setSmDepOnly(false);
    setSmValidationErrors([]);
    setSmResults({});
  }, []);

  return {
    smStop,
    setSmStop,
    smDateTime,
    setSmDateTime,
    smArrOnly,
    setSmArrOnly,
    smDepOnly,
    setSmDepOnly,
    smSelectedEnvs,
    setSmSelectedEnvs,
    smValidationErrors,
    setSmValidationErrors,
    smResults,
    setSmResults,
    smIsLoading,
    smMapConfig,
    smSelectedStopId,
    handleStopMonitorSubmit,
    handleStopMonitorMore,
    handleSmStopSelect,
    handleSmClear,
  };
}
