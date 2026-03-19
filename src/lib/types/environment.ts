export interface Environment {
  id: string;
  label: string;
  otpUrl: string;
  autocompleteUrl: string;
  apiKey: string;
  isCustom: boolean;
}

export type PredefinedEnvId = "prod" | "stage" | "dev";

// Predefined OTP environments — populated from .env
export const PREDEFINED_ENVIRONMENTS = [
  {
    id: "prod" as const,
    label: "PROD",
    otpUrl: process.env.NEXT_PUBLIC_PROD_OTP_URL || "",
    autocompleteUrl: process.env.NEXT_PUBLIC_PROD_AUTOCOMPLETE_URL || "",
    apiKey: process.env.NEXT_PUBLIC_PROD_API_KEY || "",
  },
  {
    id: "stage" as const,
    label: "STAGE",
    otpUrl: process.env.NEXT_PUBLIC_STAGE_OTP_URL || "",
    autocompleteUrl: process.env.NEXT_PUBLIC_STAGE_AUTOCOMPLETE_URL || "",
    apiKey: process.env.NEXT_PUBLIC_STAGE_API_KEY || "",
  },
  {
    id: "dev" as const,
    label: "DEV",
    otpUrl: process.env.NEXT_PUBLIC_DEV_OTP_URL || "",
    autocompleteUrl: process.env.NEXT_PUBLIC_DEV_AUTOCOMPLETE_URL || "",
    apiKey: process.env.NEXT_PUBLIC_DEV_API_KEY || "",
  },
  {
    id: "insa" as const,
    label: "INSA",
    otpUrl: "",
    autocompleteUrl: "",
    apiKey: "",
  },
];

// Predefined autocomplete environments — populated from .env
export const AUTOCOMPLETE_ENVIRONMENTS = [
  { id: "prod" as const, label: "PROD", url: process.env.NEXT_PUBLIC_PROD_AUTOCOMPLETE_URL || "", apiKey: process.env.NEXT_PUBLIC_PROD_API_KEY || "" },
  { id: "stage" as const, label: "STAGE", url: process.env.NEXT_PUBLIC_STAGE_AUTOCOMPLETE_URL || "", apiKey: process.env.NEXT_PUBLIC_STAGE_API_KEY || "" },
  { id: "dev" as const, label: "DEV", url: process.env.NEXT_PUBLIC_DEV_AUTOCOMPLETE_URL || "", apiKey: process.env.NEXT_PUBLIC_DEV_API_KEY || "" },
];

/** Resolve OTP + autocomplete config for a given environment ID */
export function getEnvironmentConfig(
  envId: string,
  customEnvironments: Environment[] = []
): { otpUrl: string; autocompleteUrl: string; apiKey: string } {
  const predefined = PREDEFINED_ENVIRONMENTS.find((e) => e.id === envId);
  if (predefined) {
    return { otpUrl: predefined.otpUrl, autocompleteUrl: predefined.autocompleteUrl, apiKey: predefined.apiKey };
  }
  const custom = customEnvironments.find((e) => e.id === envId);
  if (custom) {
    return { otpUrl: custom.otpUrl, autocompleteUrl: custom.autocompleteUrl, apiKey: custom.apiKey };
  }
  // Fallback to first predefined (PROD)
  return {
    otpUrl: PREDEFINED_ENVIRONMENTS[0].otpUrl,
    autocompleteUrl: PREDEFINED_ENVIRONMENTS[0].autocompleteUrl,
    apiKey: PREDEFINED_ENVIRONMENTS[0].apiKey,
  };
}

/** Resolve autocomplete config for a given autocomplete environment ID */
export function getAutocompleteConfig(envId: string): { url: string; apiKey: string } {
  const acEnv = AUTOCOMPLETE_ENVIRONMENTS.find((e) => e.id === envId);
  if (acEnv) return { url: acEnv.url, apiKey: acEnv.apiKey };
  return { url: AUTOCOMPLETE_ENVIRONMENTS[0].url, apiKey: AUTOCOMPLETE_ENVIRONMENTS[0].apiKey };
}

/**
 * NFR-SM2.1: Resolve Stop Monitor base URL and API key for a given environment.
 * The Stop Monitor URL is derived from the OTP URL by replacing the trailing
 * path segment (e.g. "/otp") with "/stopMonitor".
 */
export function getStopMonitorConfig(
  envId: string,
  customEnvironments: Environment[] = []
): { stopMonitorUrl: string; apiKey: string } {
  const { otpUrl, apiKey } = getEnvironmentConfig(envId, customEnvironments);
  // Replace last path segment: ".../api/otp" → ".../api/stopMonitor"
  const stopMonitorUrl = otpUrl.replace(/\/[^/]+$/, "/stopMonitor");
  return { stopMonitorUrl, apiKey };
}
