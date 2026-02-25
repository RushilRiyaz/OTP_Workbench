import type { RoutingResponse, RoutingError } from "@/lib/routing";
import type { Environment } from "../EnvironmentSelector";

// --- Shared types for comparison layouts ---

export type ComparisonResultMap = Record<
  string,
  { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }
>;

export interface ComparisonLayoutProps {
  comparisonResults: ComparisonResultMap;
  selectedEnvironments: string[];
  customEnvironments: Environment[];
}

export interface TimelineComparisonLayoutProps extends ComparisonLayoutProps {
  comparisonHoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  comparisonSelectedItinerary?: { envId: string; itineraryIndex: number } | null;
  onComparisonHover?: (envId: string, itineraryIndex: number | null) => void;
  onComparisonSelect?: (envId: string, itineraryIndex: number) => void;
  onComparisonHoverLeg?: (index: number | null) => void;
}

// --- Constants ---

export const PREDEFINED_LABELS: Record<string, string> = {
  prod: "PROD",
  stage: "STAGE",
  dev: "DEV",
};

// FR16.2: Environment comparison colors (Okabe-Ito colorblind-friendly palette)
export const ENV_COLORS = ["#0072B2", "#E69F00", "#009E73"] as const;

// --- Helpers ---

export function getEnvLabel(envId: string, customEnvironments: Environment[]): string {
  if (PREDEFINED_LABELS[envId]) return PREDEFINED_LABELS[envId];
  const custom = customEnvironments.find((e) => e.id === envId);
  return custom?.label ?? envId;
}
