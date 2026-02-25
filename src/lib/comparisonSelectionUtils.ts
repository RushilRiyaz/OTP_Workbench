import type { ComparisonItineraryRef } from "@/components/comparison/types";

// FR17: Extracted from page.tsx — pure function for multi-select toggle logic
export function toggleComparisonSelection(
  current: ComparisonItineraryRef[],
  envId: string,
  itineraryIndex: number,
  maxSelections = 3
): ComparisonItineraryRef[] {
  const existing = current.findIndex(
    (r) => r.envId === envId && r.itineraryIndex === itineraryIndex
  );
  if (existing >= 0) return current.filter((_, i) => i !== existing);
  if (current.length >= maxSelections) return current;
  return [...current, { envId, itineraryIndex }];
}
