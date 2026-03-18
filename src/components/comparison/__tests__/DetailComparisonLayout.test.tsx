// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DetailComparisonLayout } from "../DetailComparisonLayout";
import { createItinerary, createRoutingResponse } from "@/test/fixtures";
import type { ComparisonResultMap, ComparisonItineraryRef } from "@/lib/types";

afterEach(cleanup);

// Mock next-intl — return the key as-is
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock ItineraryCard — lightweight stub that encodes envId+index for uniqueness
vi.mock("../../routing/ItineraryCard", () => ({
  default: ({ index, onHoverLeg }: { index: number; onHoverLeg: (i: number | null) => void }) => (
    <div data-testid={`itinerary-card-${index}`}>
      <button data-testid={`hover-leg-${index}`} onClick={() => onHoverLeg(2)}>hover</button>
      <button data-testid={`unhover-leg-${index}`} onClick={() => onHoverLeg(null)}>unhover</button>
    </div>
  ),
}));

function makeResults(...envIds: string[]): ComparisonResultMap {
  const map: ComparisonResultMap = {};
  for (const id of envIds) {
    map[id] = {
      result: createRoutingResponse({
        plan: {
          date: 0,
          from: { name: "A", lat: 0, lon: 0 },
          to: { name: "B", lat: 0, lon: 0 },
          itineraries: [createItinerary(), createItinerary(), createItinerary()],
        },
      }),
      error: null,
      isLoading: false,
    };
  }
  return map;
}

function defaultProps() {
  return {
    comparisonResults: makeResults("prod", "stage"),
    customEnvironments: [],
    detailHoveredLeg: null,
    onDeselectItem: vi.fn(),
    onDeselectAll: vi.fn(),
    onHoverLeg: vi.fn(),
  };
}

describe("DetailComparisonLayout", () => {
  it("renders toolbar with title and exit button", () => {
    const items: ComparisonItineraryRef[] = [{ envId: "prod", itineraryIndex: 0 }];
    render(<DetailComparisonLayout {...defaultProps()} items={items} />);
    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("exit")).toBeDefined();
  });

  it("renders N columns for N items", () => {
    const items: ComparisonItineraryRef[] = [
      { envId: "prod", itineraryIndex: 0 },
      { envId: "stage", itineraryIndex: 1 },
    ];
    render(<DetailComparisonLayout {...defaultProps()} items={items} />);
    expect(screen.getByTestId("itinerary-card-0")).toBeDefined();
    expect(screen.getByTestId("itinerary-card-1")).toBeDefined();
  });

  it("each column shows env label and itinerary number", () => {
    const items: ComparisonItineraryRef[] = [{ envId: "prod", itineraryIndex: 2 }];
    render(<DetailComparisonLayout {...defaultProps()} items={items} />);
    expect(screen.getByText("PROD")).toBeDefined();
    expect(screen.getByText("#3")).toBeDefined();
  });

  it("clicking exit button calls onDeselectAll", () => {
    const props = defaultProps();
    const items: ComparisonItineraryRef[] = [{ envId: "prod", itineraryIndex: 0 }];
    render(<DetailComparisonLayout {...props} items={items} />);
    fireEvent.click(screen.getByText("exit"));
    expect(props.onDeselectAll).toHaveBeenCalledOnce();
  });

  it("clicking X on a column calls onDeselectItem with correct ref", () => {
    const props = defaultProps();
    const items: ComparisonItineraryRef[] = [{ envId: "prod", itineraryIndex: 1 }];
    render(<DetailComparisonLayout {...props} items={items} />);
    fireEvent.click(screen.getByTitle("remove"));
    expect(props.onDeselectItem).toHaveBeenCalledWith({ envId: "prod", itineraryIndex: 1 });
  });

  it("skips rendering column when itinerary not found", () => {
    const items: ComparisonItineraryRef[] = [{ envId: "prod", itineraryIndex: 99 }];
    render(<DetailComparisonLayout {...defaultProps()} items={items} />);
    expect(screen.queryByTestId("itinerary-card-99")).toBeNull();
  });

  it("leg hover maps legIndex to { slotIndex, legIndex }", () => {
    const props = defaultProps();
    const items: ComparisonItineraryRef[] = [
      { envId: "prod", itineraryIndex: 0 },
      { envId: "stage", itineraryIndex: 1 },
    ];
    render(<DetailComparisonLayout {...props} items={items} />);
    // Click hover on second column (stage, itineraryIndex=1)
    fireEvent.click(screen.getByTestId("hover-leg-1"));
    expect(props.onHoverLeg).toHaveBeenCalledWith({ slotIndex: 1, legIndex: 2 });
  });

  it("leg unhover maps to onHoverLeg(null)", () => {
    const props = defaultProps();
    const items: ComparisonItineraryRef[] = [{ envId: "prod", itineraryIndex: 0 }];
    render(<DetailComparisonLayout {...props} items={items} />);
    fireEvent.click(screen.getByTestId("unhover-leg-0"));
    expect(props.onHoverLeg).toHaveBeenCalledWith(null);
  });
});
