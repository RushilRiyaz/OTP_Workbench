import type { DetailHoveredLeg } from "@/lib/types";

// FR17: Extracted from ComparisonRoutePolylines — pure function for hover dimming logic
export function computePolylineStyle(params: {
  isWalk: boolean;
  hoveredLeg: DetailHoveredLeg | null;
  slotIndex: number;
  legIndex: number;
}): { opacity: number; weight: number } {
  const { isWalk, hoveredLeg, slotIndex, legIndex } = params;

  if (hoveredLeg === null) {
    return { opacity: isWalk ? 0.7 : 0.85, weight: isWalk ? 5 : 4 };
  }

  if (hoveredLeg.slotIndex === slotIndex && hoveredLeg.legIndex === legIndex) {
    return { opacity: 1, weight: 7 };
  }

  if (hoveredLeg.slotIndex === slotIndex) {
    return { opacity: 0.5, weight: isWalk ? 5 : 4 };
  }

  return { opacity: 0.2, weight: isWalk ? 5 : 4 };
}
