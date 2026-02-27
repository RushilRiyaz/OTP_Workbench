# FR & NFRs

## Sprint 2 - Single Routing & Routing Comparison
Complete routing functionality for single environment, multi-environment comparison, and advanced views

### Functional Requirements

#### FR9 - Routing Results Layout
- FR9.1: Display map + routing results after request
- FR9.2: Layout toggle: map above / map next to results
- FR9.3: Default: map above results
- FR9.4: Resizable areas

#### FR10 - Routing Results Overview
- FR10.1: Display planned/realtime departure time
- FR10.2: Display planned/realtime arrival time
- FR10.3: Display transfer scheme
- FR10.4: Display total duration
- FR10.5: Display number of transfers
- FR10.6: Display used transport products
- FR10.7: Display tariff zones (when results below map)
- FR10.8: Display short-distance indicator (when results below map)

#### FR11 - Itinerary Detail View
- FR11.1: All legs with start/dest stops + stop IDs
- FR11.2: Intermediate stops (expandable/collapsible) + stop IDs
- FR11.3: Planned/realtime times per leg
- FR11.4: Duration/products per leg
- FR11.5: Tariff zones per stop
- FR11.6: Additional info (walk distance, trip ID, warnings, info messages)
- FR11.7: Route shape on map with distinct color per leg
- FR11.8: Leg hover → highlight shape on map

#### FR12 - Advanced Itinerary Info
- FR12.1: View complete trip course for a leg
- FR12.2: Highlight only itinerary-relevant portion
- FR12.3: View formatted JSON response
- FR12.4: Copy JSON response
- FR12.5: Load earlier/later itineraries

#### FR13 - Routing Comparison Layouts
- FR13.1: Side-by-side horizontal (default)
- FR13.2: Side-by-side vertical
- FR13.3: Horizontal overview

#### FR14 - Side-by-Side Horizontal
- FR14.1: One column per environment
- FR14.2: Vertical timeline w/ synchronized scrolling
- FR14.3: Itineraries ordered by realtime departure
- FR14.4: Transfer schemes show relative duration
- FR14.5: Hover → detail info + map update
- FR14.6: Click → itinerary detail view

#### FR15 - Side-by-Side Vertical
- FR15.1: One column per environment
- FR15.2: Transfer schemes displayed vertically on timeline
- FR15.3: Length/position reflects realtime duration/timing
- FR15.4: Same interaction as horizontal

#### FR16 - Horizontal Overview
- FR16.1: All itineraries in single list
- FR16.2: Color code per environment (#0072B2, #E69F00, #009E73)
- FR16.3: Legend mapping colors to APIs

#### FR17 - Detail Comparison View
- FR17.1: Select up to 3 itineraries for comparison
- FR17.2: Dedicated column per itinerary
- FR17.3: Unique color per itinerary (#0072B2, #E69F00, #009E73)
- FR17.4: Route shapes displayed simultaneously on map
- FR17.5: Exit comparison view → return to overview

### Non-Functional Requirements

#### NFR1 - Localization
- NFR1.1: Support English and German

---

## Summary

| Category | Completed |
|----------|-----------|
| Functional Requirements | 50 |
| Non-Functional Requirements | 1 |
| **Total** | **51** |
