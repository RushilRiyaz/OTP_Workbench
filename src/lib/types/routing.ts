// FR5: Time & Routing Options

export type TimingMode = "departAt" | "arriveBy";

// FR5.2: Predefined travel modes (Transit modes from Routing API)
export const TRAVEL_MODES = [
  { id: "TRANSIT" },
  { id: "BIKE" },
  { id: "BIKERENTAL" },
  { id: "WALK" },
  { id: "CAR" },
  { id: "CARRENTAL" },
  { id: "BUS" },
  { id: "TRAM" },
  { id: "SUBURB" },
  { id: "TRAIN" },
  { id: "TAXI4884" },
  { id: "ESCOOTER" },
  { id: "FLEXA" },
  { id: "SUBWAY" },
  { id: "RRB" },
  { id: "OD" },
  { id: "ICE" },
  { id: "IC" },
  { id: "COACH" },
  { id: "RE" },
] as const;

export type TravelModeId = (typeof TRAVEL_MODES)[number]["id"];

// FR5.5: Optional parameters
export interface OptionalParams {
  accessibility: boolean;
  shortWalk: boolean;
  lessTransfers: boolean;
  transitOnly: boolean;
}

export interface RoutingOptions {
  timingMode: TimingMode; // FR5.1
  travelModes: TravelModeId[]; // FR5.2
  optionalParams: OptionalParams; // FR5.5
  customParams: string; // FR5.6
}

// FR5.4: Default values
export const defaultRoutingOptions: RoutingOptions = {
  timingMode: "departAt",
  travelModes: ["TRANSIT"], // FR5.4: TRANSIT preselected by default
  optionalParams: {
    accessibility: false,
    shortWalk: false,
    lessTransfers: false,
    transitOnly: false,
  },
  customParams: "", // FR5.6
};

export const OPTIONAL_PARAM_IDS = ["accessibility", "shortWalk", "lessTransfers", "transitOnly"] as const;
export const OPTIONAL_PARAMS = OPTIONAL_PARAM_IDS.map((id) => ({ id }));
