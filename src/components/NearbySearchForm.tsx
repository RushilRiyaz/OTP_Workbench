"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  NEARBY_TYPES,
  NEARBY_VEHICLE_TYPES,
  NEARBY_SOURCES,
  type NearbyType,
  type NearbyVehicleType,
  type NearbySource,
  type NearbySearchParams,
} from "@/lib/nearbySearch";

export interface NearbySearchFormState {
  center: { lat: number; lon: number } | null;
  radius: number;
  types: NearbyType[];
  vehicleTypes: NearbyVehicleType[];
  sources: NearbySource[];
  providers: string;
  maxResults: string;
}

export const defaultNearbySearchFormState: NearbySearchFormState = {
  center: null,
  radius: 500,
  types: [],
  vehicleTypes: [],
  sources: [],
  providers: "",
  maxResults: "",
};

interface NearbySearchFormProps {
  formState: NearbySearchFormState;
  onFormStateChange: (state: NearbySearchFormState) => void;
  isLoading: boolean;
  onSubmit: () => void;
  error: string | null;
}

export default function NearbySearchForm({
  formState,
  onFormStateChange,
  isLoading,
  onSubmit,
  error,
}: NearbySearchFormProps) {
  const t = useTranslations("NearbySearch");
  const tVal = useTranslations("NearbySearchValidation");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [centerInput, setCenterInput] = useState(
    formState.center ? `${formState.center.lat},${formState.center.lon}` : ""
  );

  // Sync external center changes (e.g. from map click) into the text input
  const displayCenter = formState.center
    ? `${formState.center.lat.toFixed(6)},${formState.center.lon.toFixed(6)}`
    : centerInput;

  const handleCenterInputChange = (value: string) => {
    setCenterInput(value);
    // Try to parse lat,lon
    const match = value.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        onFormStateChange({ ...formState, center: { lat, lon } });
        return;
      }
    }
    // Invalid or incomplete — clear center
    if (formState.center) {
      onFormStateChange({ ...formState, center: null });
    }
  };

  const handleSubmit = () => {
    const errors: string[] = [];
    if (!formState.center) {
      errors.push(tVal("centerRequired"));
    }
    if (!formState.radius || formState.radius <= 0) {
      errors.push(tVal("radiusPositive"));
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    onSubmit();
  };

  const toggleType = (type: NearbyType) => {
    const next = formState.types.includes(type)
      ? formState.types.filter((t) => t !== type)
      : [...formState.types, type];
    onFormStateChange({ ...formState, types: next });
  };

  const toggleVehicleType = (vt: NearbyVehicleType) => {
    const next = formState.vehicleTypes.includes(vt)
      ? formState.vehicleTypes.filter((v) => v !== vt)
      : [...formState.vehicleTypes, vt];
    onFormStateChange({ ...formState, vehicleTypes: next });
  };

  const toggleSource = (src: NearbySource) => {
    const next = formState.sources.includes(src)
      ? formState.sources.filter((s) => s !== src)
      : [...formState.sources, src];
    onFormStateChange({ ...formState, sources: next });
  };

  return (
    <div className="space-y-3">
      {/* FR22.2: Center Coordinate */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          {t("center")}
        </label>
        <input
          type="text"
          value={displayCenter}
          onChange={(e) => handleCenterInputChange(e.target.value)}
          placeholder={t("centerPlaceholder")}
          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
            validationErrors.some((e) => e === tVal("centerRequired"))
              ? "border-red-400"
              : "border-zinc-200 dark:border-zinc-700"
          }`}
        />
        {formState.center && (
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {t("clickMapToSetCenter")}
          </p>
        )}
        {!formState.center && (
          <p className="text-[10px] text-lvb-yellow mt-0.5">
            {t("clickMapToSetCenter")}
          </p>
        )}
      </div>

      {/* FR22.3: Radius */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          {t("radius")}
        </label>
        <input
          type="number"
          min={1}
          value={formState.radius}
          onChange={(e) =>
            onFormStateChange({
              ...formState,
              radius: parseInt(e.target.value) || 0,
            })
          }
          placeholder={t("radiusPlaceholder")}
          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
            validationErrors.some((e) => e === tVal("radiusPositive"))
              ? "border-red-400"
              : "border-zinc-200 dark:border-zinc-700"
          }`}
        />
      </div>

      {/* FR22.4: Types */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
          {t("types")}
          {formState.types.length === 0 && (
            <span className="ml-1.5 text-[10px] font-normal normal-case tracking-normal text-zinc-500">
              ({t("allTypes")})
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {NEARBY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                formState.types.includes(type)
                  ? "bg-lvb-yellow/15 border-lvb-yellow/50 text-zinc-900 dark:text-zinc-100"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              {t(type)}
            </button>
          ))}
        </div>
      </div>

      {/* FR22.5: Vehicle Types */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
          {t("vehicleTypes")}
          {formState.vehicleTypes.length === 0 && (
            <span className="ml-1.5 text-[10px] font-normal normal-case tracking-normal text-zinc-500">
              ({t("allVehicleTypes")})
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {NEARBY_VEHICLE_TYPES.map((vt) => (
            <button
              key={vt}
              type="button"
              onClick={() => toggleVehicleType(vt)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                formState.vehicleTypes.includes(vt)
                  ? "bg-lvb-yellow/15 border-lvb-yellow/50 text-zinc-900 dark:text-zinc-100"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              {t(vt)}
            </button>
          ))}
        </div>
      </div>

      {/* FR22.6: Sources */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
          {t("sources")}
          {formState.sources.length === 0 && (
            <span className="ml-1.5 text-[10px] font-normal normal-case tracking-normal text-zinc-500">
              ({t("allSources")})
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {NEARBY_SOURCES.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => toggleSource(src)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
                formState.sources.includes(src)
                  ? "bg-lvb-yellow/15 border-lvb-yellow/50 text-zinc-900 dark:text-zinc-100"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              {t(src)}
            </button>
          ))}
        </div>
      </div>

      {/* FR22.7: Providers */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          {t("providers")}
        </label>
        <input
          type="text"
          value={formState.providers}
          onChange={(e) =>
            onFormStateChange({ ...formState, providers: e.target.value })
          }
          placeholder={t("providersPlaceholder")}
          className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
        />
      </div>

      {/* FR22.8: Max Results */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          {t("maxResults")}
        </label>
        <input
          type="number"
          min={1}
          value={formState.maxResults}
          onChange={(e) =>
            onFormStateChange({ ...formState, maxResults: e.target.value })
          }
          placeholder={t("maxResultsPlaceholder")}
          className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
        />
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          {validationErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-600 dark:text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* API error */}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* FR22: Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-2.5 text-sm font-semibold text-lvb-dark bg-lvb-yellow rounded-xl hover:bg-lvb-yellow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 shadow-sm"
      >
        {isLoading ? t("searching") : t("search")}
      </button>
    </div>
  );
}

/** Convert form state to API params */
export function toNearbySearchParams(
  formState: NearbySearchFormState
): NearbySearchParams | null {
  if (!formState.center) return null;
  return {
    center: formState.center,
    radius: formState.radius,
    types: formState.types.length > 0 ? formState.types : undefined,
    vehicleTypes:
      formState.vehicleTypes.length > 0 ? formState.vehicleTypes : undefined,
    sources: formState.sources.length > 0 ? formState.sources : undefined,
    providers: formState.providers.trim()
      ? formState.providers
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : undefined,
    maxResults: formState.maxResults
      ? parseInt(formState.maxResults)
      : undefined,
  };
}
