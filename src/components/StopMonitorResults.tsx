"use client";

// FR19–FR21: Stop Monitor results display (multi-column departure/arrival board)

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { MonitorItem, StopMonitorAlert, StopMonitorEnvState } from "@/lib/stopMonitor";
import { formatDelay, formatAlertCategory } from "@/lib/legUtils";
import { getEnvLabel } from "@/lib/types";
import type { Environment } from "@/lib/types";

// --- Internal sub-components ---

interface MonitorEntryRowProps {
  item: MonitorItem;
  /** When true, force "ARR" tag; when false, force "DEP" tag; when undefined, infer from times */
  arrOnly?: boolean;
  depOnly?: boolean;
  t: ReturnType<typeof useTranslations<"StopMonitor">>;
}

function MonitorEntryRow({ item, arrOnly, depOnly, t }: MonitorEntryRowProps) {
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  // FR19.2.1: Use arrival_time for arrival events, departure_time otherwise
  const isArrivalEvent =
    arrOnly === true ? true
    : depOnly === true ? false
    : item.arrival_time?.slice(0, 5) === item.departure_time?.slice(0, 5);

  const baseTime = isArrivalEvent ? item.arrival_time : item.departure_time;
  const baseDelay = isArrivalEvent ? item.delay_time : item.departure_delay;

  const scheduledTime = baseTime?.slice(0, 5) ?? "??:??";

  // FR19.2.2: Realtime time + delay badge
  const delayStr = formatDelay(baseDelay ?? undefined);
  const isDelayed = delayStr !== null;
  const isLate = isDelayed && !delayStr!.startsWith("-");

  // Compute realtime time if delayed
  let realtimeTime: string | null = null;
  if (isDelayed && baseDelay !== null && baseTime) {
    const [h, m, s] = baseTime.split(":").map(Number);
    const totalSeconds = h * 3600 + m * 60 + (s ?? 0) + (baseDelay ?? 0);
    const rh = Math.floor(totalSeconds / 3600) % 24;
    const rm = Math.floor((totalSeconds % 3600) / 60);
    realtimeTime = `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
  }

  // FR19.2.3: Route badge color
  const badgeColor = item.route_color ? `#${item.route_color}` : "#6b7280";

  // FR19.2.5: Cancellation
  const isCancelled = item.trip_cancelled || item.stop_cancelled;
  const cancelLabel = item.trip_cancelled ? t("tripCancelled") : t("stopCancelled");

  // ARR/DEP tag: shown when neither filter forces a single type
  const showEventTag = !arrOnly && !depOnly;

  // FR21.2: Track info
  const hasTrackChange =
    item.track !== null &&
    item.track_scheduled !== null &&
    item.track !== item.track_scheduled;
  const showTrack = item.track !== null;

  // FR21.1: Alerts
  const hasAlerts = (item.alerts?.length ?? 0) > 0;

  const delayMinutes = Math.abs(Math.round((baseDelay ?? 0) / 60));

  return (
    <div
      className={`flex flex-col gap-1 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 ${
        isCancelled ? "opacity-50" : ""
      }`}
    >
      {/* Main row: route badge | headsign | ARR/DEP tag | time | delay */}
      <div className="flex items-center gap-2 min-w-0">
        {/* FR19.2.3: Route badge */}
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
          style={{ backgroundColor: badgeColor }}
        >
          {item.transport_type.slice(0, 3)} {item.line}
        </span>

        {/* FR19.2.4: Headsign */}
        <span
          className={`text-sm truncate flex-1 min-w-0 ${
            isCancelled
              ? "line-through text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {item.trip_headsign}
        </span>

        {/* ARR/DEP tag — mixed mode only */}
        {showEventTag && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
              isArrivalEvent
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            }`}
          >
            {isArrivalEvent ? t("arrTag") : t("depTag")}
          </span>
        )}

        {/* FR19.2.5: Cancelled label */}
        {isCancelled && (
          <span className="text-xs font-semibold text-red-500 dark:text-red-400 shrink-0">
            {cancelLabel}
          </span>
        )}

        {/* FR19.2.1/19.2.2: Time + delay — right-aligned */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
          <span
            className={`text-sm font-mono font-semibold tabular-nums ${
              isCancelled
                ? "line-through text-red-500"
                : isDelayed
                ? "text-zinc-400 dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {scheduledTime}
          </span>

          {/* Realtime time (only when delayed) */}
          {realtimeTime && (
            <span className="text-sm font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {realtimeTime}
            </span>
          )}

          {/* Delay badge */}
          {isDelayed && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                isLate
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              }`}
            >
              {isLate ? t("delayed", { minutes: delayMinutes }) : t("early", { minutes: delayMinutes })}
            </span>
          )}
        </div>
      </div>

      {/* FR21.2: Track info */}
      {showTrack && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 pl-0">
          {hasTrackChange
            ? t("trackChange", { from: item.track_scheduled!, to: item.track! })
            : t("track", { track: item.track! })}
        </div>
      )}

      {/* FR21.1: Alerts toggle */}
      {hasAlerts && (
        <div>
          <button
            onClick={() => setAlertsExpanded((v) => !v)}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline focus:outline-none"
          >
            ⚠ {item.alerts.length} alert{item.alerts.length !== 1 ? "s" : ""}
          </button>
          {alertsExpanded && (
            <ul className="mt-1 flex flex-col gap-1">
              {(item.alerts ?? []).map((alert: StopMonitorAlert, i: number) => (
                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold">[{formatAlertCategory(alert.alertCategory)}]</span>{" "}
                  {alert.alertHeaderText}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- JSON syntax highlighter (reuse pattern from RoutingResults) ---

function JsonLine({ text }: { text: string }) {
  const keyMatch = text.match(/^(\s*)(".*?")(\s*:\s*)(.*)/);
  if (keyMatch) {
    const [, indent, key, colon, value] = keyMatch;
    const valueColor = value.startsWith('"')
      ? "text-green-600 dark:text-green-400"
      : value === "true" || value === "false"
      ? "text-blue-600 dark:text-blue-400"
      : value === "null"
      ? "text-zinc-400"
      : "text-orange-600 dark:text-orange-400";
    return (
      <div>
        <span className="text-zinc-500">{indent}</span>
        <span className="text-purple-600 dark:text-purple-400">{key}</span>
        <span className="text-zinc-500">{colon}</span>
        <span className={valueColor}>{value}</span>
      </div>
    );
  }
  return <div className="text-zinc-500">{text}</div>;
}

// --- Column component ---

interface StopMonitorColumnProps {
  envId: string;
  envLabel: string;
  state: StopMonitorEnvState;
  stopName: string;
  dateTime: string;
  onMore: (envId: string) => void;
  showJson: boolean;
  arrOnly?: boolean;
  depOnly?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (scrollTop: number) => void;
  t: ReturnType<typeof useTranslations<"StopMonitor">>;
}

function StopMonitorColumn({
  envId,
  envLabel,
  state,
  stopName,
  dateTime,
  onMore,
  showJson,
  arrOnly,
  depOnly,
  scrollRef,
  onScroll,
  t,
}: StopMonitorColumnProps) {
  // FR19.1.3: Format query date
  const queryDate = dateTime
    ? new Date(dateTime).toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Berlin",
      })
    : "";

  // FR19.2.6: Sort by departure time ascending
  const sortedItems = Array.isArray(state.data)
    ? [...state.data].sort((a, b) =>
        (a.departure_time ?? "").localeCompare(b.departure_time ?? "")
      )
    : [];

  return (
    <div className="flex flex-col flex-1 min-w-0 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      {/* FR19.1.2: Column header */}
      <div className="flex flex-col gap-0.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 bg-lvb-yellow text-lvb-dark rounded-full shrink-0">
            {envLabel}
          </span>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {stopName}
          </span>
        </div>
        {/* FR19.1.3: Query date */}
        {queryDate && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{queryDate}</span>
        )}
      </div>

      {/* FR19.1.4: Loading state */}
      {state.isLoading ? (
        <div className="flex items-center justify-center flex-1 py-8">
          <div className="w-6 h-6 border-2 border-lvb-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : /* FR19.1.5: Error state */
      state.error ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8 px-4 gap-2">
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            {t("errorTitle")}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {state.error.message}
          </span>
        </div>
      ) : /* Results */
      sortedItems.length === 0 ? (
        <div className="flex items-center justify-center flex-1 py-8 px-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            {t("noResults")}
          </span>
        </div>
      ) : showJson ? (
        /* FR20.2: JSON view */
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2"
          onScroll={(e) => onScroll?.((e.target as HTMLDivElement).scrollTop)}
        >
          <pre className="text-xs font-mono leading-5">
            {JSON.stringify(state.data, null, 2)
              .split("\n")
              .map((line, i) => (
                <JsonLine key={i} text={line} />
              ))}
          </pre>
        </div>
      ) : (
        /* FR19.2: Board view */
        <div
          ref={scrollRef}
          className="flex flex-col flex-1 overflow-y-auto"
          onScroll={(e) => onScroll?.((e.target as HTMLDivElement).scrollTop)}
        >
          {sortedItems.map((item, i) => (
            <MonitorEntryRow key={`${item.trip_id}-${item.stop_id}-${i}`} item={item} arrOnly={arrOnly} depOnly={depOnly} t={t} />
          ))}

          {/* FR19.3: More button */}
          <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => onMore(envId)}
              disabled={state.isLoadingMore}
              className="w-full py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-lvb-yellow focus:outline-none flex items-center justify-center gap-1"
            >
              {state.isLoadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  {t("more")}
                </span>
              ) : (
                t("more")
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main component ---

interface StopMonitorResultsProps {
  selectedEnvironments: string[];
  customEnvironments: Environment[];
  results: Record<string, StopMonitorEnvState>;
  stopName: string;
  dateTime: string;
  onMore: (envId: string) => void;
  onClear: () => void;
  arrOnly?: boolean;
  depOnly?: boolean;
}

export default function StopMonitorResults({
  selectedEnvironments,
  customEnvironments,
  results,
  stopName,
  dateTime,
  onMore,
  onClear,
  arrOnly,
  depOnly,
}: StopMonitorResultsProps) {
  const t = useTranslations("StopMonitor");

  // FR20.1: View toggle state (shared across columns)
  const [view, setView] = useState<"board" | "json">("board");
  // FR20.3: Copy state — keyed per envId
  const [copyStates, setCopyStates] = useState<Record<string, "idle" | "success" | "error">>({});
  // Scroll sync
  const [syncScroll, setSyncScroll] = useState(false);
  const scrollRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});
  const isSyncingRef = useRef(false);

  // Ensure a ref exists for each env
  for (const envId of selectedEnvironments) {
    if (!scrollRefs.current[envId]) {
      scrollRefs.current[envId] = { current: null };
    }
  }

  const handleColumnScroll = useCallback((sourceEnvId: string, scrollTop: number) => {
    if (!syncScroll || isSyncingRef.current) return;
    isSyncingRef.current = true;
    for (const [envId, ref] of Object.entries(scrollRefs.current)) {
      if (envId !== sourceEnvId && ref.current) {
        ref.current.scrollTop = scrollTop;
      }
    }
    isSyncingRef.current = false;
  }, [syncScroll]);

  const handleCopyJson = useCallback(
    async (envId: string) => {
      const data = results[envId]?.data;
      if (!data) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopyStates((s) => ({ ...s, [envId]: "success" }));
      } catch {
        setCopyStates((s) => ({ ...s, [envId]: "error" }));
      }
      setTimeout(() => setCopyStates((s) => ({ ...s, [envId]: "idle" })), 2000);
    },
    [results]
  );

  const hasAnyResults = Object.keys(results).length > 0;

  if (!hasAnyResults) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
        <span className="text-sm">{t("submitToSee")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar: clear + view toggle + copy */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        {/* Clear button */}
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>

        {/* FR20.1: Board / JSON toggle — pill segmented control */}
        <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-0.5">
          {(["board", "json"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none ${
                view === v
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/50"
              }`}
            >
              {v === "board" ? t("viewBoard") : t("viewJson")}
            </button>
          ))}
        </div>

        {/* Scroll sync toggle — multiple columns in either view */}
        {selectedEnvironments.length > 1 && (
          <button
            onClick={() => setSyncScroll((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
              syncScroll
                ? "bg-lvb-yellow text-lvb-dark"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title={syncScroll ? t("syncScrollOn") : t("syncScrollOff")}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {t("syncScroll")}
          </button>
        )}

        {/* FR20.3: Copy JSON (one per env in JSON view, else global) */}
        {view === "json" && selectedEnvironments.length === 1 && (
          <button
            onClick={() => handleCopyJson(selectedEnvironments[0])}
            className="ml-auto text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:ring-2 focus:ring-lvb-yellow focus:outline-none"
          >
            {copyStates[selectedEnvironments[0]] === "success"
              ? t("copied")
              : copyStates[selectedEnvironments[0]] === "error"
              ? t("copyFailed")
              : t("copyJson")}
          </button>
        )}
      </div>

      {/* FR19.1.1: One column per environment */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        {selectedEnvironments.map((envId) => {
          const state = results[envId];
          if (!state) return null;
          const envLabel = getEnvLabel(envId, customEnvironments);

          return (
            <div key={envId} className="flex flex-col flex-1 min-w-0 relative">
              {/* Per-column copy button in JSON view with multiple columns */}
              {view === "json" && selectedEnvironments.length > 1 && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => handleCopyJson(envId)}
                    className="text-xs px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:ring-2 focus:ring-lvb-yellow focus:outline-none"
                  >
                    {copyStates[envId] === "success"
                      ? t("copied")
                      : copyStates[envId] === "error"
                      ? t("copyFailed")
                      : t("copyJson")}
                  </button>
                </div>
              )}
              <StopMonitorColumn
                envId={envId}
                envLabel={envLabel}
                state={state}
                stopName={stopName}
                dateTime={dateTime}
                onMore={onMore}
                showJson={view === "json"}
                arrOnly={arrOnly}
                depOnly={depOnly}
                scrollRef={scrollRefs.current[envId]}
                onScroll={(top) => handleColumnScroll(envId, top)}
                t={t}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
