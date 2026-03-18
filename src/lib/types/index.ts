// Barrel re-export for all shared types

export type { LocationValue } from "./location";
export { emptyLocationValue } from "./location";

export type { TimingMode, TravelModeId, OptionalParams, RoutingOptions } from "./routing";
export { TRAVEL_MODES, defaultRoutingOptions, OPTIONAL_PARAM_IDS, OPTIONAL_PARAMS } from "./routing";

export type { Environment, PredefinedEnvId } from "./environment";
export {
  PREDEFINED_ENVIRONMENTS,
  AUTOCOMPLETE_ENVIRONMENTS,
  getEnvironmentConfig,
  getAutocompleteConfig,
  getStopMonitorConfig,
} from "./environment";

export type {
  ComparisonResultMap,
  ComparisonItineraryRef,
  DetailHoveredLeg,
  ComparisonLayoutProps,
  TimelineComparisonLayoutProps,
  DetailComparisonLayoutProps,
  ComparisonMapItinerary,
} from "./comparison";
export {
  PREDEFINED_LABELS,
  ENV_COLORS,
  ITINERARY_COLORS,
  getEnvLabel,
} from "./comparison";

// FR6: Shared types for request handling
import type { LocationValue } from "./location";
import type { RoutingOptions } from "./routing";

// FR6.2-6.3: Validation error type
export interface ValidationError {
  field: "start" | "destination" | "dateTime" | "travelModes" | "stop";
  message: string;
}

// FR6.4: Request history entry type
export interface RequestHistoryEntry {
  id: string;
  timestamp: number;
  start: LocationValue;
  destination: LocationValue;
  dateTime: string;
  routingOptions: RoutingOptions;
  selectedEnvironment: string;
  selectedAutocompleteEnv?: string;
  displayLabel: string; // e.g. "Augustusplatz -> Hauptbahnhof"
}
