// FR6: Shared types for request handling

import { LocationValue } from "@/components/LocationInput";
import { RoutingOptions } from "@/components/RoutingOptionsForm";

// FR6.2-6.3: Validation error type
export interface ValidationError {
  field: "start" | "destination" | "dateTime" | "travelModes";
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
  selectedAutocompleteEnv: string;
  displayLabel: string; // e.g. "Augustusplatz -> Hauptbahnhof"
}
