import { describe, it, expect } from "vitest";
import { serializeFormState, deserializeUrlParams } from "@/lib/urlParams";
import type { SerializableFormState } from "@/lib/urlParams";
import {
  coordsLocation,
  stopIdLocation,
  autocompleteLocation,
  emptyLocation,
  defaultOptions,
} from "@/test/fixtures";

// Access private functions via module internals — we test them indirectly through round-trips

describe("urlParams", () => {
  // --- Round-trip: serialize then deserialize ---

  describe("coordinates round-trip", () => {
    it("serializes to c:lat,lon and deserializes back", () => {
      const state: SerializableFormState = {
        start: coordsLocation(51.34, 12.37),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const serialized = serializeFormState(state);
      const params = new URLSearchParams(serialized);
      expect(params.get("from")).toBe("c:51.34,12.37");

      const deserialized = deserializeUrlParams(params);
      expect(deserialized.start?.type).toBe("coordinates");
      expect(deserialized.start?.coordinates).toEqual({ lat: 51.34, lon: 12.37 });
    });
  });

  describe("stopId round-trip", () => {
    it("serializes to s:id and deserializes back", () => {
      const state: SerializableFormState = {
        start: stopIdLocation("12345"),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const serialized = serializeFormState(state);
      const params = new URLSearchParams(serialized);
      expect(params.get("from")).toBe("s:12345");

      const deserialized = deserializeUrlParams(params);
      expect(deserialized.start?.type).toBe("stopId");
      expect(deserialized.start?.stopId).toBe("12345");
    });
  });

  describe("autocomplete round-trip", () => {
    it("serializes to a:id:name:lat,lon and deserializes back", () => {
      const state: SerializableFormState = {
        start: autocompleteLocation("loc-1", "Augustusplatz", 51.3397, 12.3816),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const serialized = serializeFormState(state);
      const params = new URLSearchParams(serialized);
      const from = params.get("from")!;
      expect(from).toMatch(/^a:/);

      const deserialized = deserializeUrlParams(params);
      expect(deserialized.start?.type).toBe("autocomplete");
      expect(deserialized.start?.location?.name).toBe("Augustusplatz");
      expect(deserialized.start?.location?.lat).toBe(51.3397);
      expect(deserialized.start?.location?.lon).toBe(12.3816);
    });

    it("handles colons in autocomplete name via encoding", () => {
      const state: SerializableFormState = {
        start: autocompleteLocation("loc:2", "Hbf: Gleis 3", 51.34, 12.37),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const serialized = serializeFormState(state);
      const deserialized = deserializeUrlParams(new URLSearchParams(serialized));
      expect(deserialized.start?.location?.id).toBe("loc:2");
      expect(deserialized.start?.location?.name).toBe("Hbf: Gleis 3");
    });
  });

  // --- serializeLocation edge cases (tested via serializeFormState) ---

  describe("serializeLocation edge cases", () => {
    it("omits start/dest when type is null", () => {
      const state: SerializableFormState = {
        start: emptyLocation(),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const serialized = serializeFormState(state);
      const params = new URLSearchParams(serialized);
      expect(params.has("from")).toBe(false);
      expect(params.has("to")).toBe(false);
    });

    it("omits start when coords type but coordinates is null", () => {
      const loc = coordsLocation();
      loc.coordinates = null;
      const state: SerializableFormState = {
        start: loc,
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.has("from")).toBe(false);
    });
  });

  // --- deserializeLocation edge cases ---

  describe("deserializeLocation edge cases", () => {
    it("returns undefined start for NaN coords", () => {
      const params = new URLSearchParams("from=c:abc,def");
      const result = deserializeUrlParams(params);
      expect(result.start).toBeUndefined();
    });

    it("returns undefined start for unknown prefix", () => {
      const params = new URLSearchParams("from=x:something");
      const result = deserializeUrlParams(params);
      expect(result.start).toBeUndefined();
    });

    it("returns undefined start for empty value", () => {
      const params = new URLSearchParams("from=");
      const result = deserializeUrlParams(params);
      expect(result.start).toBeUndefined();
    });
  });

  // --- serializeFormState ---

  describe("serializeFormState", () => {
    it("produces full param string for complete state", () => {
      const state: SerializableFormState = {
        start: coordsLocation(51.34, 12.37),
        destination: autocompleteLocation("loc-1", "Hbf", 51.3, 12.3),
        dateTime: "2026-02-03T14:30",
        routingOptions: defaultOptions({
          timingMode: "arriveBy",
          travelModes: ["BUS", "TRAM"],
          optionalParams: { shortWalk: true, lessTransfers: false, accessibility: true, transitOnly: false },
          customParams: "numItineraries=5",
        }),
        selectedEnvironment: "stage",
        selectedAutocompleteEnv: "stage",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.get("from")).toBe("c:51.34,12.37");
      expect(params.get("to")).toMatch(/^a:/);
      expect(params.get("dt")).toBe("2026-02-03T14:30");
      expect(params.get("arr")).toBe("1");
      expect(params.get("modes")).toBe("BUS,TRAM");
      expect(params.get("sw")).toBe("1");
      expect(params.get("acc")).toBe("1");
      expect(params.has("lt")).toBe(false);
      expect(params.has("tonly")).toBe(false);
      expect(params.get("cp")).toBe("numItineraries=5");
      expect(params.get("env")).toBe("stage");
    });

    it("omits arr param for default departAt mode", () => {
      const state: SerializableFormState = {
        start: coordsLocation(),
        destination: coordsLocation(51.3, 12.3),
        dateTime: "2026-02-03T14:30",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.has("arr")).toBe(false);
    });

    it("sets arr=1 for arriveBy mode", () => {
      const state: SerializableFormState = {
        start: coordsLocation(),
        destination: coordsLocation(51.3, 12.3),
        dateTime: "",
        routingOptions: defaultOptions({ timingMode: "arriveBy" }),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.get("arr")).toBe("1");
    });

    it("omits optional params when all false", () => {
      const state: SerializableFormState = {
        start: coordsLocation(),
        destination: coordsLocation(51.3, 12.3),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.has("sw")).toBe(false);
      expect(params.has("lt")).toBe(false);
      expect(params.has("acc")).toBe(false);
      expect(params.has("tonly")).toBe(false);
    });

    it("omits env param for prod environment", () => {
      const state: SerializableFormState = {
        start: emptyLocation(),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.has("env")).toBe(false);
    });

    it("includes env param for non-prod environment", () => {
      const state: SerializableFormState = {
        start: emptyLocation(),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "dev",
        selectedAutocompleteEnv: "dev",
        customEnvironments: [],
      };
      const params = new URLSearchParams(serializeFormState(state));
      expect(params.get("env")).toBe("dev");
    });

    it("serializes custom environments as JSON", () => {
      const state: SerializableFormState = {
        start: emptyLocation(),
        destination: emptyLocation(),
        dateTime: "",
        routingOptions: defaultOptions(),
        selectedEnvironment: "prod",
        selectedAutocompleteEnv: "prod",
        customEnvironments: [{ id: "custom-1", label: "My Env", otpUrl: "http://example.com", autocompleteUrl: "", apiKey: "", isCustom: true }],
      };
      const params = new URLSearchParams(serializeFormState(state));
      const cenvs = JSON.parse(params.get("cenvs")!);
      expect(cenvs).toHaveLength(1);
      expect(cenvs[0].id).toBe("custom-1");
    });
  });

  // --- deserializeUrlParams ---

  describe("deserializeUrlParams", () => {
    it("returns empty state for empty params", () => {
      const result = deserializeUrlParams(new URLSearchParams());
      expect(result).toEqual({});
    });

    it("deserializes full params to complete state", () => {
      const params = new URLSearchParams({
        from: "c:51.34,12.37",
        to: "s:99001",
        dt: "2026-02-03T14:30",
        arr: "1",
        modes: "BUS,TRAM",
        sw: "1",
        lt: "1",
        env: "stage",
      });
      const result = deserializeUrlParams(params);
      expect(result.start?.type).toBe("coordinates");
      expect(result.destination?.type).toBe("stopId");
      expect(result.dateTime).toBe("2026-02-03T14:30");
      expect(result.routingOptions?.timingMode).toBe("arriveBy");
      expect(result.routingOptions?.travelModes).toEqual(["BUS", "TRAM"]);
      expect(result.routingOptions?.optionalParams.shortWalk).toBe(true);
      expect(result.routingOptions?.optionalParams.lessTransfers).toBe(true);
      expect(result.selectedEnvironment).toBe("stage");
    });

    it("filters invalid travel modes", () => {
      const params = new URLSearchParams({ modes: "BUS,INVALID,TRAM,NOPE" });
      const result = deserializeUrlParams(params);
      expect(result.routingOptions?.travelModes).toEqual(["BUS", "TRAM"]);
    });

    it("ignores invalid JSON for custom envs", () => {
      const params = new URLSearchParams({ cenvs: "not-json" });
      const result = deserializeUrlParams(params);
      expect(result.customEnvironments).toBeUndefined();
    });

    it("filters custom envs missing required fields", () => {
      const cenvs = JSON.stringify([
        { id: "ok", label: "OK", otpUrl: "http://example.com", autocompleteUrl: "", apiKey: "", isCustom: true },
        { id: "bad" },  // missing label/otpUrl
      ]);
      const params = new URLSearchParams({ cenvs });
      const result = deserializeUrlParams(params);
      expect(result.customEnvironments).toHaveLength(1);
      expect(result.customEnvironments![0].id).toBe("ok");
      expect(result.customEnvironments![0].label).toBe("OK");
    });
  });
});
