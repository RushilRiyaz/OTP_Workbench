import { describe, it, expect } from "vitest";
import {
  getEnvLabel,
  ITINERARY_COLORS,
  ENV_COLORS,
  PREDEFINED_LABELS,
} from "@/lib/types";
import type { Environment } from "@/lib/types";

const customs: Environment[] = [
  { id: "custom-1", label: "My Custom Env", otpUrl: "", autocompleteUrl: "", apiKey: "" },
];

describe("getEnvLabel", () => {
  it("returns predefined label for prod/stage/dev", () => {
    expect(getEnvLabel("prod", [])).toBe("PROD");
    expect(getEnvLabel("stage", [])).toBe("STAGE");
    expect(getEnvLabel("dev", [])).toBe("DEV");
  });

  it("returns custom env label when found", () => {
    expect(getEnvLabel("custom-1", customs)).toBe("My Custom Env");
  });

  it("falls back to raw envId when not predefined and not in customs", () => {
    expect(getEnvLabel("unknown-env", [])).toBe("unknown-env");
    expect(getEnvLabel("unknown-env", customs)).toBe("unknown-env");
  });

  it("handles empty customEnvironments array", () => {
    expect(getEnvLabel("custom-1", [])).toBe("custom-1");
  });
});

describe("color constants", () => {
  it("ITINERARY_COLORS has exactly 3 entries", () => {
    expect(ITINERARY_COLORS).toHaveLength(3);
  });

  it("ENV_COLORS has exactly 3 entries", () => {
    expect(ENV_COLORS).toHaveLength(3);
  });

  it("all color values are valid hex strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const c of ITINERARY_COLORS) expect(c).toMatch(hexPattern);
    for (const c of ENV_COLORS) expect(c).toMatch(hexPattern);
  });
});

describe("PREDEFINED_LABELS", () => {
  it("contains prod, stage, dev", () => {
    expect(Object.keys(PREDEFINED_LABELS)).toEqual(
      expect.arrayContaining(["prod", "stage", "dev"])
    );
  });
});
