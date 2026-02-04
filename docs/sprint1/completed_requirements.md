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

#### NFR3 - Technology
- NFR3.1: Implement using Next.js
- NFR3.2: Run within LVB technical ecosystem

#### NFR4 - Data Persistence
- NFR4.1: Store request history in browser (local storage)

---

## Summary

| Category | Completed |
|----------|-----------|
| Functional Requirements | 40 |
| Non-Functional Requirements | 3 |
| **Total** | **43** |
