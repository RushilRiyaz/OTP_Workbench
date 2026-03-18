import { describe, it, expect } from "vitest";

// FR4.6: Unit tests for coordinate parsing logic
// Testing the parseCoordinates logic used in LocationInput.tsx

/**
 * Replicate the parseCoordinates function for testing
 * This matches the implementation in LocationInput.tsx
 */
function parseCoordinates(input: string): { lat: number; lon: number } | null {
  const trimmed = input.trim();

  // Match patterns: "lat, lon" or "lat,lon" or "lat lon"
  // Coordinates can be negative and must have valid decimal format
  const regex = /^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/;
  const match = trimmed.match(regex);

  if (!match) {
    return null;
  }

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  // Validate ranges: lat (-90 to 90), lon (-180 to 180)
  if (isNaN(lat) || isNaN(lon)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}

describe("parseCoordinates (FR4.6)", () => {
  // --- Valid coordinate formats ---

  describe("valid formats", () => {
    it("parses comma + space format: '51.34, 12.37'", () => {
      const result = parseCoordinates("51.34, 12.37");
      expect(result).toEqual({ lat: 51.34, lon: 12.37 });
    });

    it("parses comma only format: '51.34,12.37'", () => {
      const result = parseCoordinates("51.34,12.37");
      expect(result).toEqual({ lat: 51.34, lon: 12.37 });
    });

    it("parses space only format: '51.34 12.37'", () => {
      const result = parseCoordinates("51.34 12.37");
      expect(result).toEqual({ lat: 51.34, lon: 12.37 });
    });

    it("parses with multiple spaces: '51.34   12.37'", () => {
      const result = parseCoordinates("51.34   12.37");
      expect(result).toEqual({ lat: 51.34, lon: 12.37 });
    });

    it("parses with leading/trailing whitespace", () => {
      const result = parseCoordinates("  51.34, 12.37  ");
      expect(result).toEqual({ lat: 51.34, lon: 12.37 });
    });

    it("parses integer coordinates", () => {
      const result = parseCoordinates("51, 12");
      expect(result).toEqual({ lat: 51, lon: 12 });
    });

    it("parses mixed integer and decimal", () => {
      const result = parseCoordinates("51, 12.5");
      expect(result).toEqual({ lat: 51, lon: 12.5 });
    });
  });

  // --- Negative coordinates ---

  describe("negative coordinates", () => {
    it("parses negative latitude", () => {
      const result = parseCoordinates("-33.87, 151.21");
      expect(result).toEqual({ lat: -33.87, lon: 151.21 });
    });

    it("parses negative longitude", () => {
      const result = parseCoordinates("40.71, -74.01");
      expect(result).toEqual({ lat: 40.71, lon: -74.01 });
    });

    it("parses both negative", () => {
      const result = parseCoordinates("-33.45, -70.67");
      expect(result).toEqual({ lat: -33.45, lon: -70.67 });
    });
  });

  // --- Leipzig area coordinates (project context) ---

  describe("Leipzig area coordinates", () => {
    it("parses Leipzig Hauptbahnhof", () => {
      const result = parseCoordinates("51.3455, 12.3818");
      expect(result).toEqual({ lat: 51.3455, lon: 12.3818 });
    });

    it("parses Leipzig Markt", () => {
      const result = parseCoordinates("51.3406, 12.3747");
      expect(result).toEqual({ lat: 51.3406, lon: 12.3747 });
    });

    it("parses Augustusplatz", () => {
      const result = parseCoordinates("51.3397, 12.3816");
      expect(result).toEqual({ lat: 51.3397, lon: 12.3816 });
    });
  });

  // --- Boundary values ---

  describe("boundary values", () => {
    it("accepts latitude at -90", () => {
      const result = parseCoordinates("-90, 0");
      expect(result).toEqual({ lat: -90, lon: 0 });
    });

    it("accepts latitude at 90", () => {
      const result = parseCoordinates("90, 0");
      expect(result).toEqual({ lat: 90, lon: 0 });
    });

    it("accepts longitude at -180", () => {
      const result = parseCoordinates("0, -180");
      expect(result).toEqual({ lat: 0, lon: -180 });
    });

    it("accepts longitude at 180", () => {
      const result = parseCoordinates("0, 180");
      expect(result).toEqual({ lat: 0, lon: 180 });
    });

    it("accepts origin (0, 0)", () => {
      const result = parseCoordinates("0, 0");
      expect(result).toEqual({ lat: 0, lon: 0 });
    });
  });

  // --- Invalid inputs ---

  describe("invalid inputs", () => {
    it("returns null for empty string", () => {
      expect(parseCoordinates("")).toBeNull();
    });

    it("returns null for single number", () => {
      expect(parseCoordinates("51.34")).toBeNull();
    });

    it("returns null for text input", () => {
      expect(parseCoordinates("Leipzig")).toBeNull();
    });

    it("returns null for three numbers", () => {
      expect(parseCoordinates("51.34, 12.37, 100")).toBeNull();
    });

    it("returns null for mixed text and numbers", () => {
      expect(parseCoordinates("lat: 51.34, lon: 12.37")).toBeNull();
    });
  });

  // --- Out of range ---

  describe("out of range values", () => {
    it("returns null for latitude > 90", () => {
      expect(parseCoordinates("91, 12")).toBeNull();
    });

    it("returns null for latitude < -90", () => {
      expect(parseCoordinates("-91, 12")).toBeNull();
    });

    it("returns null for longitude > 180", () => {
      expect(parseCoordinates("51, 181")).toBeNull();
    });

    it("returns null for longitude < -180", () => {
      expect(parseCoordinates("51, -181")).toBeNull();
    });

    it("returns null for extreme latitude", () => {
      expect(parseCoordinates("1000, 12")).toBeNull();
    });

    it("returns null for extreme longitude", () => {
      expect(parseCoordinates("51, 1000")).toBeNull();
    });
  });

  // --- Edge cases ---

  describe("edge cases", () => {
    it("returns null for just whitespace", () => {
      expect(parseCoordinates("   ")).toBeNull();
    });

    it("returns null for comma only", () => {
      expect(parseCoordinates(",")).toBeNull();
    });

    it("returns null for decimal points only", () => {
      expect(parseCoordinates("., .")).toBeNull();
    });

    it("handles high precision decimals", () => {
      const result = parseCoordinates("51.340199123456, 12.374390123456");
      expect(result?.lat).toBeCloseTo(51.340199123456, 10);
      expect(result?.lon).toBeCloseTo(12.374390123456, 10);
    });
  });
});
