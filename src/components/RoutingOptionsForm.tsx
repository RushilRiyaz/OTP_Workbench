"use client";

// FR5: Time & Routing Options

export type TimingMode = "departAt" | "arriveBy";

// FR5.2: Predefined travel modes (Transit modes from Routing API)
export const TRAVEL_MODES = [
  { id: "TRANSIT", label: "Transit", icon: "🚇" },
  { id: "BUS", label: "Bus", icon: "🚌" },
  { id: "TRAM", label: "Tram", icon: "🚊" },
  { id: "SUBURB", label: "S-Bahn", icon: "🚈" },
  { id: "TRAIN", label: "Train", icon: "🚆" },
  { id: "FLEXA", label: "Flexa", icon: "🚐" },
  { id: "SUBWAY", label: "U-Bahn", icon: "🚇" },
  { id: "FERRY", label: "Ferry", icon: "⛴️" },
  { id: "GONDOLA", label: "Gondola", icon: "🚡" },
] as const;

export type TravelModeId = (typeof TRAVEL_MODES)[number]["id"];

// FR5.5: Optional parameters
export interface OptionalParams {
  accessibility: boolean;
  shortWalk: boolean;
  lessTransfers: boolean;
  transitOnly: boolean;
}

export const OPTIONAL_PARAMS = [
  { id: "accessibility", label: "Wheelchair Accessible", icon: "♿" },
  { id: "shortWalk", label: "Short Walk", icon: "🚶" },
  { id: "lessTransfers", label: "Less Transfers", icon: "🔄" },
  { id: "transitOnly", label: "Transit Only", icon: "🚏" },
] as const;

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

interface RoutingOptionsFormProps {
  value: RoutingOptions;
  onChange: (value: RoutingOptions) => void;
}

export default function RoutingOptionsForm({
  value,
  onChange,
}: RoutingOptionsFormProps) {
  // FR5.1: Handle timing mode change
  const handleTimingModeChange = (mode: TimingMode) => {
    onChange({ ...value, timingMode: mode });
  };

  // FR5.2: Handle travel mode toggle
  const handleTravelModeToggle = (modeId: TravelModeId) => {
    const isSelected = value.travelModes.includes(modeId);

    if (isSelected) {
      // FR5.3: Enforce at least one travel mode selected
      if (value.travelModes.length <= 1) {
        return; // Don't allow deselecting the last mode
      }
      // Remove mode
      const newModes = value.travelModes.filter((m) => m !== modeId);
      onChange({ ...value, travelModes: newModes });
    } else {
      // Add mode
      onChange({ ...value, travelModes: [...value.travelModes, modeId] });
    }
  };

  // FR5.3: Check if mode is the last one selected (for disabled styling)
  const isLastSelectedMode = (modeId: TravelModeId) => {
    return value.travelModes.length === 1 && value.travelModes.includes(modeId);
  };

  // FR5.5: Handle optional param toggle
  const handleOptionalParamToggle = (paramId: keyof OptionalParams) => {
    onChange({
      ...value,
      optionalParams: {
        ...value.optionalParams,
        [paramId]: !value.optionalParams[paramId],
      },
    });
  };

  // FR5.6: Handle custom params change
  const handleCustomParamsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...value, customParams: e.target.value });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* FR5.1: Depart At / Arrive By Toggle */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Timing
        </label>
        <div className="flex rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => handleTimingModeChange("departAt")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              value.timingMode === "departAt"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            Depart At
          </button>
          <button
            type="button"
            onClick={() => handleTimingModeChange("arriveBy")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-zinc-300 dark:border-zinc-700 ${
              value.timingMode === "arriveBy"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            Arrive By
          </button>
        </div>
      </div>

      {/* FR5.2: Travel Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Travel Modes
        </label>
        <div className="flex flex-wrap gap-2">
          {TRAVEL_MODES.map((mode) => {
            const isSelected = value.travelModes.includes(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleTravelModeToggle(mode.id)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ${
                        isLastSelectedMode(mode.id) ? "cursor-not-allowed opacity-75" : ""
                      }`
                    : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
                title={isLastSelectedMode(mode.id) ? "At least one travel mode must be selected" : undefined}
              >
                <span className="mr-1.5">{mode.icon}</span>
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FR5.5: Optional Parameters */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Options
        </label>
        <div className="flex flex-col gap-2">
          {OPTIONAL_PARAMS.map((param) => {
            const isChecked = value.optionalParams[param.id];
            return (
              <label
                key={param.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleOptionalParamToggle(param.id)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 dark:bg-zinc-800"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="mr-1.5">{param.icon}</span>
                  {param.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* FR5.6: Custom Parameters */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Custom Parameters
        </label>
        <textarea
          value={value.customParams}
          onChange={handleCustomParamsChange}
          placeholder="e.g. numItineraries=3&maxWalkDistance=1000"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Add extra query parameters (key=value format)
        </p>
      </div>
    </div>
  );
}
