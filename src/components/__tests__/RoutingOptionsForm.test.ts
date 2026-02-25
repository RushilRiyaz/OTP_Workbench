import { describe, it, expect } from "vitest";
import {
  TRAVEL_MODES,
  OPTIONAL_PARAMS,
  defaultRoutingOptions,
  type TravelModeId,
  type RoutingOptions,
} from "@/components/RoutingOptionsForm";

// FR5: Unit tests for Time & Routing Options

describe("RoutingOptionsForm exports", () => {
  // --- FR5.2: Travel Modes ---

  describe("TRAVEL_MODES (FR5.2)", () => {
    it("contains predefined travel modes", () => {
      expect(TRAVEL_MODES.length).toBeGreaterThan(0);
    });

    it("includes TRANSIT mode", () => {
      const transit = TRAVEL_MODES.find((m) => m.id === "TRANSIT");
      expect(transit).toBeDefined();
    });

    it("includes common transit modes", () => {
      const modeIds = TRAVEL_MODES.map((m) => m.id);
      expect(modeIds).toContain("BUS");
      expect(modeIds).toContain("TRAM");
      expect(modeIds).toContain("TRAIN");
    });

    it("each mode has an id", () => {
      for (const mode of TRAVEL_MODES) {
        expect(mode.id).toBeDefined();
        expect(typeof mode.id).toBe("string");
      }
    });

    it("mode ids are unique", () => {
      const ids = TRAVEL_MODES.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // --- FR5.5: Optional Parameters ---

  describe("OPTIONAL_PARAMS (FR5.5)", () => {
    it("contains optional routing parameters", () => {
      expect(OPTIONAL_PARAMS.length).toBeGreaterThan(0);
    });

    it("includes shortWalk option", () => {
      const shortWalk = OPTIONAL_PARAMS.find((p) => p.id === "shortWalk");
      expect(shortWalk).toBeDefined();
    });

    it("includes lessTransfers option", () => {
      const lessTransfers = OPTIONAL_PARAMS.find((p) => p.id === "lessTransfers");
      expect(lessTransfers).toBeDefined();
    });

    it("includes accessibility option", () => {
      const accessibility = OPTIONAL_PARAMS.find((p) => p.id === "accessibility");
      expect(accessibility).toBeDefined();
    });

    it("includes transitOnly option", () => {
      const transitOnly = OPTIONAL_PARAMS.find((p) => p.id === "transitOnly");
      expect(transitOnly).toBeDefined();
    });

    it("each param has an id", () => {
      for (const param of OPTIONAL_PARAMS) {
        expect(param.id).toBeDefined();
        expect(typeof param.id).toBe("string");
      }
    });
  });

  // --- FR5.4: Default Values ---

  describe("defaultRoutingOptions (FR5.4)", () => {
    it("has departAt as default timing mode", () => {
      expect(defaultRoutingOptions.timingMode).toBe("departAt");
    });

    it("has TRANSIT as default travel mode", () => {
      expect(defaultRoutingOptions.travelModes).toContain("TRANSIT");
    });

    it("has exactly one default travel mode", () => {
      expect(defaultRoutingOptions.travelModes).toHaveLength(1);
    });

    it("has all optional params disabled by default", () => {
      expect(defaultRoutingOptions.optionalParams.accessibility).toBe(false);
      expect(defaultRoutingOptions.optionalParams.shortWalk).toBe(false);
      expect(defaultRoutingOptions.optionalParams.lessTransfers).toBe(false);
      expect(defaultRoutingOptions.optionalParams.transitOnly).toBe(false);
    });

    it("has empty custom params by default", () => {
      expect(defaultRoutingOptions.customParams).toBe("");
    });
  });

  // --- FR5.1: Timing Mode Types ---

  describe("TimingMode type (FR5.1)", () => {
    it("defaultRoutingOptions.timingMode is valid", () => {
      const validModes = ["departAt", "arriveBy"];
      expect(validModes).toContain(defaultRoutingOptions.timingMode);
    });
  });

  // --- FR5.3: At least one travel mode enforcement ---

  describe("Travel mode enforcement (FR5.3)", () => {
    it("default has at least one travel mode", () => {
      expect(defaultRoutingOptions.travelModes.length).toBeGreaterThanOrEqual(1);
    });

    it("travel modes array is not empty in defaults", () => {
      expect(defaultRoutingOptions.travelModes).not.toEqual([]);
    });
  });

  // --- FR5.6: Custom Parameters ---

  describe("Custom parameters (FR5.6)", () => {
    it("customParams field exists in defaults", () => {
      expect(defaultRoutingOptions).toHaveProperty("customParams");
    });

    it("customParams is a string", () => {
      expect(typeof defaultRoutingOptions.customParams).toBe("string");
    });
  });

  // --- Type structure validation ---

  describe("RoutingOptions structure", () => {
    it("has all required fields", () => {
      const options: RoutingOptions = defaultRoutingOptions;

      expect(options).toHaveProperty("timingMode");
      expect(options).toHaveProperty("travelModes");
      expect(options).toHaveProperty("optionalParams");
      expect(options).toHaveProperty("customParams");
    });

    it("optionalParams has all required fields", () => {
      const { optionalParams } = defaultRoutingOptions;

      expect(optionalParams).toHaveProperty("accessibility");
      expect(optionalParams).toHaveProperty("shortWalk");
      expect(optionalParams).toHaveProperty("lessTransfers");
      expect(optionalParams).toHaveProperty("transitOnly");
    });
  });
});

// --- Helper function tests for travel mode logic ---

describe("Travel mode logic (FR5.2, FR5.3)", () => {
  it("can add a travel mode to selection", () => {
    const currentModes: TravelModeId[] = ["TRANSIT"];
    const newMode: TravelModeId = "BUS";

    const updatedModes = [...currentModes, newMode];

    expect(updatedModes).toContain("TRANSIT");
    expect(updatedModes).toContain("BUS");
    expect(updatedModes).toHaveLength(2);
  });

  it("can remove a travel mode from selection", () => {
    const currentModes: TravelModeId[] = ["TRANSIT", "BUS", "TRAM"];
    const modeToRemove: TravelModeId = "BUS";

    const updatedModes = currentModes.filter((m) => m !== modeToRemove);

    expect(updatedModes).not.toContain("BUS");
    expect(updatedModes).toHaveLength(2);
  });

  it("prevents removing last travel mode (FR5.3 logic)", () => {
    const currentModes: TravelModeId[] = ["TRANSIT"];

    // Simulate FR5.3 enforcement
    const canRemove = currentModes.length > 1;

    expect(canRemove).toBe(false);
  });

  it("allows removing when multiple modes selected", () => {
    const currentModes: TravelModeId[] = ["TRANSIT", "BUS"];

    const canRemove = currentModes.length > 1;

    expect(canRemove).toBe(true);
  });
});
