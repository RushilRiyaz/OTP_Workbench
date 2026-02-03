// FR6.6: URL parameter serialization for shareable links

import { LocationValue, emptyLocationValue } from "@/components/LocationInput";
import { RoutingOptions, defaultRoutingOptions, TravelModeId, TRAVEL_MODES } from "@/components/RoutingOptionsForm";
import { Environment } from "@/components/EnvironmentSelector";

// Form state that can be serialized to URL
export interface SerializableFormState {
  start: LocationValue;
  destination: LocationValue;
  dateTime: string;
  routingOptions: RoutingOptions;
  selectedEnvironment: string;
  customEnvironments: Environment[];
}

// URL param keys (short to keep URLs reasonable)
const PARAM_KEYS = {
  from: "from",
  to: "to",
  dateTime: "dt",
  arriveBy: "arr",
  modes: "modes",
  shortWalk: "sw",
  lessTransfers: "lt",
  accessibility: "acc",
  transitOnly: "tonly",
  customParams: "cp",
  env: "env",
  customEnvs: "cenvs",
} as const;

// Location type prefixes to preserve input type
const LOCATION_PREFIX = {
  coordinates: "c:",
  stopId: "s:",
  autocomplete: "a:",
} as const;

// Serialize LocationValue to URL string
function serializeLocation(location: LocationValue): string | null {
  if (!location.type) return null;

  switch (location.type) {
    case "coordinates":
      if (!location.coordinates) return null;
      return `${LOCATION_PREFIX.coordinates}${location.coordinates.lat},${location.coordinates.lon}`;
    case "stopId":
      if (!location.stopId) return null;
      return `${LOCATION_PREFIX.stopId}${location.stopId}`;
    case "autocomplete":
      if (!location.location) return null;
      // Encode id, name, lat, lon - separated by colon
      return `${LOCATION_PREFIX.autocomplete}${location.location.id}:${encodeURIComponent(location.location.name)}:${location.location.lat},${location.location.lon}`;
    default:
      return null;
  }
}

// Deserialize URL string to LocationValue
function deserializeLocation(value: string): LocationValue | null {
  if (!value) return null;

  if (value.startsWith(LOCATION_PREFIX.coordinates)) {
    const coords = value.slice(LOCATION_PREFIX.coordinates.length);
    const [lat, lon] = coords.split(",").map(Number);
    if (isNaN(lat) || isNaN(lon)) return null;
    return {
      text: `${lat}, ${lon}`,
      type: "coordinates",
      location: null,
      stopId: null,
      coordinates: { lat, lon },
    };
  }

  if (value.startsWith(LOCATION_PREFIX.stopId)) {
    const stopId = value.slice(LOCATION_PREFIX.stopId.length);
    return {
      text: `Stop ID: ${stopId}`,
      type: "stopId",
      location: null,
      stopId,
      coordinates: null,
    };
  }

  if (value.startsWith(LOCATION_PREFIX.autocomplete)) {
    const rest = value.slice(LOCATION_PREFIX.autocomplete.length);
    // Format: id:name:lat,lon
    const parts = rest.split(":");
    if (parts.length < 2) return null;

    const id = parts[0];
    const name = decodeURIComponent(parts[1]);

    // Parse lat/lon if present
    let lat = 0;
    let lon = 0;
    if (parts[2]) {
      const coords = parts[2].split(",");
      lat = parseFloat(coords[0]) || 0;
      lon = parseFloat(coords[1]) || 0;
    }

    return {
      text: name,
      type: "autocomplete",
      location: {
        id,
        name,
        data: name,
        lat,
        lon,
        ptype: "",
        stadt: null,
        stadtteil: null,
        postalcode: null,
        landkreis: null,
        streetname: null,
        housenumber: null,
        tags: null,
      },
      stopId: null,
      coordinates: null,
    };
  }

  return null;
}

// Validate travel mode ID
function isValidTravelMode(mode: string): mode is TravelModeId {
  return TRAVEL_MODES.some((m) => m.id === mode);
}

// Serialize form state to URL search params string
export function serializeFormState(state: SerializableFormState): string {
  const params = new URLSearchParams();

  // Location
  const from = serializeLocation(state.start);
  const to = serializeLocation(state.destination);
  if (from) params.set(PARAM_KEYS.from, from);
  if (to) params.set(PARAM_KEYS.to, to);

  // DateTime
  if (state.dateTime) {
    params.set(PARAM_KEYS.dateTime, state.dateTime);
  }

  // Routing options
  const opts = state.routingOptions;

  // Only include non-default values to keep URL short
  if (opts.timingMode === "arriveBy") {
    params.set(PARAM_KEYS.arriveBy, "1");
  }

  // Travel modes (always include since it's required)
  if (opts.travelModes.length > 0) {
    params.set(PARAM_KEYS.modes, opts.travelModes.join(","));
  }

  // Optional params (only if enabled)
  if (opts.optionalParams.shortWalk) params.set(PARAM_KEYS.shortWalk, "1");
  if (opts.optionalParams.lessTransfers) params.set(PARAM_KEYS.lessTransfers, "1");
  if (opts.optionalParams.accessibility) params.set(PARAM_KEYS.accessibility, "1");
  if (opts.optionalParams.transitOnly) params.set(PARAM_KEYS.transitOnly, "1");

  // Custom params
  if (opts.customParams.trim()) {
    params.set(PARAM_KEYS.customParams, opts.customParams);
  }

  // Environment
  if (state.selectedEnvironment && state.selectedEnvironment !== "prod") {
    params.set(PARAM_KEYS.env, state.selectedEnvironment);
  }

  // Custom environments (full JSON for custom envs)
  if (state.customEnvironments.length > 0) {
    params.set(PARAM_KEYS.customEnvs, JSON.stringify(state.customEnvironments));
  }

  return params.toString();
}

// Deserialize URL search params to partial form state
export function deserializeUrlParams(searchParams: URLSearchParams): Partial<SerializableFormState> {
  const state: Partial<SerializableFormState> = {};

  // Location
  const from = searchParams.get(PARAM_KEYS.from);
  const to = searchParams.get(PARAM_KEYS.to);
  if (from) {
    const parsed = deserializeLocation(from);
    if (parsed) state.start = parsed;
  }
  if (to) {
    const parsed = deserializeLocation(to);
    if (parsed) state.destination = parsed;
  }

  // DateTime
  const dt = searchParams.get(PARAM_KEYS.dateTime);
  if (dt) state.dateTime = dt;

  // Routing options
  const routingOptions: RoutingOptions = { ...defaultRoutingOptions };
  let hasRoutingOptions = false;

  // Timing mode
  if (searchParams.get(PARAM_KEYS.arriveBy) === "1") {
    routingOptions.timingMode = "arriveBy";
    hasRoutingOptions = true;
  }

  // Travel modes
  const modes = searchParams.get(PARAM_KEYS.modes);
  if (modes) {
    const modeList = modes.split(",").filter(isValidTravelMode);
    if (modeList.length > 0) {
      routingOptions.travelModes = modeList;
      hasRoutingOptions = true;
    }
  }

  // Optional params
  if (searchParams.get(PARAM_KEYS.shortWalk) === "1") {
    routingOptions.optionalParams.shortWalk = true;
    hasRoutingOptions = true;
  }
  if (searchParams.get(PARAM_KEYS.lessTransfers) === "1") {
    routingOptions.optionalParams.lessTransfers = true;
    hasRoutingOptions = true;
  }
  if (searchParams.get(PARAM_KEYS.accessibility) === "1") {
    routingOptions.optionalParams.accessibility = true;
    hasRoutingOptions = true;
  }
  if (searchParams.get(PARAM_KEYS.transitOnly) === "1") {
    routingOptions.optionalParams.transitOnly = true;
    hasRoutingOptions = true;
  }

  // Custom params
  const cp = searchParams.get(PARAM_KEYS.customParams);
  if (cp) {
    routingOptions.customParams = cp;
    hasRoutingOptions = true;
  }

  if (hasRoutingOptions) {
    state.routingOptions = routingOptions;
  }

  // Environment
  const env = searchParams.get(PARAM_KEYS.env);
  if (env) state.selectedEnvironment = env;

  // Custom environments
  const cenvs = searchParams.get(PARAM_KEYS.customEnvs);
  if (cenvs) {
    try {
      const parsed = JSON.parse(cenvs);
      if (Array.isArray(parsed)) {
        // Validate each item has required Environment properties
        const validEnvs = parsed.filter(
          (item): item is Environment =>
            typeof item === "object" &&
            item !== null &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.url === "string"
        );
        if (validEnvs.length > 0) {
          state.customEnvironments = validEnvs;
        }
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  return state;
}
