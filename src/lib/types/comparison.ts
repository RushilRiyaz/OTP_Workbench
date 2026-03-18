import type { RoutingResponse, RoutingError, Itinerary } from "@/lib/routing";
import type { Environment } from "./environment";

// --- Shared types for comparison layouts ---

export type ComparisonResultMap = Record<
  string,
  { result: RoutingResponse | null; error: RoutingError | null; isLoading: boolean }
>;

// FR17.1: Reference to a specific itinerary within a specific environment
export type ComparisonItineraryRef = { envId: string; itineraryIndex: number };

// FR17: Hovered leg in detail comparison view (slot = column index)
export type DetailHoveredLeg = { slotIndex: number; legIndex: number };

export interface ComparisonLayoutProps {
  comparisonResults: ComparisonResultMap;
  selectedEnvironments: string[];
  customEnvironments: Environment[];
}

export interface TimelineComparisonLayoutProps extends ComparisonLayoutProps {
  comparisonHoveredItinerary?: { envId: string; itineraryIndex: number } | null;
  comparisonSelectedItineraries?: ComparisonItineraryRef[];
  onComparisonHover?: (envId: string, itineraryIndex: number | null) => void;
  onComparisonToggleSelect?: (envId: string, itineraryIndex: number) => void;
  onComparisonHoverLeg?: (index: number | null) => void;
}

// FR17.4: Props for DetailComparisonLayout
export interface DetailComparisonLayoutProps {
  items: ComparisonItineraryRef[];
  comparisonResults: ComparisonResultMap;
  customEnvironments: Environment[];
  onDeselectItem: (ref: ComparisonItineraryRef) => void;
  onDeselectAll: () => void;
  detailHoveredLeg: DetailHoveredLeg | null;
  onHoverLeg: (leg: DetailHoveredLeg | null) => void;
}

// FR17.4: Itinerary with assigned color for map rendering
export interface ComparisonMapItinerary {
  itinerary: Itinerary;
  color: string;
}

// --- Constants ---

export const PREDEFINED_LABELS: Record<string, string> = {
  prod: "PROD",
  stage: "STAGE",
  dev: "DEV",
};

// FR16.2: Environment comparison colors (Okabe-Ito colorblind-friendly palette)
export const ENV_COLORS = ["#0072B2", "#E69F00", "#009E73"] as const;

// FR17.3: Itinerary-level colors for detail comparison (same Okabe-Ito palette)
export const ITINERARY_COLORS = ["#0072B2", "#E69F00", "#009E73"] as const;

// --- Helpers ---

export function getEnvLabel(envId: string, customEnvironments: Environment[]): string {
  if (PREDEFINED_LABELS[envId]) return PREDEFINED_LABELS[envId];
  const custom = customEnvironments.find((e) => e.id === envId);
  return custom?.label ?? envId;
}
