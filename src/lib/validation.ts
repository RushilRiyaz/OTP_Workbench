// FR6.2-6.3: Validation logic for routing requests

import { LocationValue } from "@/components/LocationInput";
import { RoutingOptions } from "@/components/RoutingOptionsForm";
import { ValidationError } from "@/lib/types";

export interface ValidationParams {
  start: LocationValue;
  destination: LocationValue;
  dateTime: string;
  routingOptions: RoutingOptions;
}

// Helper to check if location has valid data
function isLocationValid(location: LocationValue): boolean {
  if (!location.type) return false;

  switch (location.type) {
    case "coordinates":
      return location.coordinates !== null;
    case "stopId":
      return location.stopId !== null && location.stopId.trim() !== "";
    case "autocomplete":
      return location.location !== null;
    default:
      return false;
  }
}

// FR6.2: Validate mandatory inputs pre-request
// FR4.3: Date/time is mandatory (strict validation)
// Returns translation keys as messages — translate at display site
export function validateRoutingParams(params: ValidationParams): ValidationError[] {
  const errors: ValidationError[] = [];

  // FR4.1: Start location mandatory (validate type AND data)
  if (!isLocationValid(params.start)) {
    errors.push({
      field: "start",
      message: "startRequired",
    });
  }

  // FR4.2: Destination mandatory (validate type AND data)
  if (!isLocationValid(params.destination)) {
    errors.push({
      field: "destination",
      message: "destinationRequired",
    });
  }

  // FR4.3: Date/time mandatory (strict per user decision)
  if (!params.dateTime.trim()) {
    errors.push({
      field: "dateTime",
      message: "dateTimeRequired",
    });
  }

  // FR5.3: At least one travel mode (already enforced in UI, but validate)
  if (params.routingOptions.travelModes.length === 0) {
    errors.push({
      field: "travelModes",
      message: "travelModeRequired",
    });
  }

  return errors;
}
