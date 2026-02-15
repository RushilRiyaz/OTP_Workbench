# FR & NFRs

## Sprint 1 - Foundation & Core Infrastructure
Base application setup, parameter handling, and map basics

### Functional Requirements

#### FR2 - Application Layout
- FR2.1: Parameter Area on left side
- FR2.2: Evaluation Area on right side
- FR2.3: Tab-based navigation between use cases
- FR2.4: Routing use case selected by default

#### FR3 - Environment Selection
- FR3.1: Select from predefined environments (PROD, STAGE, DEV)
- FR3.2: Add custom environments
- FR3.3: Select up to 3 environments for comparison
- FR3.4: Mix predefined + custom environments
- FR3.5: Single environment only when Routing use case selected
- FR3.6: PROD preselected by default

#### FR4 - Journey Definition
- FR4.1: Define start location (mandatory)
- FR4.2: Define destination (mandatory)
- FR4.3: Define date/time (mandatory)
- FR4.4: Location input via LVB autocomplete
- FR4.5: Location input via stop IDs
- FR4.6: Location input via geographic coordinates
- FR4.7: Select from last 10 start/destination inputs
- FR4.8: One-click clear start/destination fields
- FR4.9: One-click swap start/destination

#### FR5 - Time & Routing Options
- FR5.1: Select depart at / arrive by mode
- FR5.2: Select one+ travel modes from predefined list
- FR5.3: Enforce at least one travel mode selected
- FR5.4: Default: depart at + TRANSIT mode
- FR5.5: Optional params (shortWalk, lessTransfers, etc.)
- FR5.6: Free-text field for custom parameters

#### FR6 - Request Handling & History
- FR6.1: Start routing request from parameters
- FR6.2: Validate mandatory inputs pre-request
- FR6.3: Display error if mandatory fields missing
- FR6.4: Maintain last 20 requests in browser
- FR6.5: Load historical request (overwrites current, no warning)
- FR6.6: Generate shareable link with all params

#### FR7 - Parameter Area Layout
- FR7.1: Collapse/expand parameter area

#### FR8 - Map Interaction
- FR8.1: Display start/destination points
- FR8.2: Left-click → fill start if empty
- FR8.3: Left-click → fill destination if start filled & dest empty
- FR8.4: Popup with coords if both filled
- FR8.5: Copy coordinates
- FR8.6: Display coords under cursor
- FR8.7: Map fills entire Evaluation Area before request
- FR8.8: Default center: Leipzig main station

### Non-Functional Requirements

#### NFR1 - Localization
- NFR1.1: Support English and German

#### NFR3 - Technology
- NFR3.1: Implement using Next.js
- NFR3.2: Run within LVB technical ecosystem
- NFR3.3: Reuse modules from previous project (optional)

#### NFR4 - Data Persistence
- NFR4.1: Store request history in browser (local storage)

#### NFR5 - Infrastructure
- NFR5.1: LVB provides access to required infrastructure/services

---

## Sprint 2 - Single Routing Use Case
Complete routing functionality for single environment

### Functional Requirements

#### FR1 - General Use Cases (Partial)
- FR1.1: Test single routing API (Routing use case)
- FR1.3: Central parameter area for all routing parameters

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

### Non-Functional Requirements

#### NFR2 - Target Audience
- NFR2.1: Routing developers and technical staff

---

## Sprint 3 - Routing Comparison Features
Multi-environment comparison and advanced views

### Functional Requirements

#### FR1 - General Use Cases (Remaining)
- FR1.2: Compare multiple routing APIs (Routing Comparison use case)
- FR1.4: GUI placeholders for future use cases (Autocomplete, Stopmonitor, NearBySearch) - non-functional

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

---
