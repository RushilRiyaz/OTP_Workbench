# Sprint 3 — INSA Routing & Codebase Restructuring
INSA HAFAS routing integration and codebase decomposition

## Functional Requirements

#### FR1 — INSA Routing API
- FR1.1: Send requests to the INSA `/trip` endpoint with `accessId` and `format=json`
- FR1.2: Map origin/destination from autocomplete or coordinate input to INSA coordinate parameters
- FR1.3: Reject bare stop IDs with an error — INSA requires coordinates
- FR1.4: Map OTP travel mode selections to the INSA `products` bitmask (OR-combined); default to all modes if none match
- FR1.5: Map the arrive-by timing mode to INSA's `searchForArrival=1` parameter
- FR1.6: Apply a 30-second timeout, consistent with existing OTP routing
- FR1.7: Classify errors into the same types as OTP (`api`, `parse`, `network`, `timeout`, `cancelled`)
- FR1.8: Log all INSA requests and responses to the browser console

#### FR2 — INSA Response Normalization
- FR2.1: Convert each INSA `Trip` to an OTP `Itinerary` with start/end times, duration, transfers, legs, walk/transit/waiting times
- FR2.2: Convert JNY (journey) legs to OTP `TransitLeg` with mode, route name, headsign, agency, and intermediate stops
- FR2.3: Convert all non-JNY leg types (WALK, TRSF, KISS, BIKE, TAXI, etc.) to OTP `NonTransitLeg` — forward-compatible with any new HAFAS leg types
- FR2.4: Normalize HAFAS `Stops.Stop` field (handles single object, array, or undefined)
- FR2.5: Decode Google Polyline encoded geometry into OTP `legGeometry.points[]` format; fall back to straight line if unavailable
- FR2.6: Handle DST-aware datetime parsing — when HAFAS omits timezone offset, compute correct UTC offset for `Europe/Berlin` using the Intl API instead of hardcoding CET

#### FR3 — INSA Environment & Comparison
- FR3.1: Add INSA as a predefined environment alongside PROD, STAGE, and DEV
- FR3.2: INSA is selectable in both single-routing (single-select) and routing comparison (multi-select, up to 3 environments)
- FR3.3: Autocomplete continues to use the selected OTP environment — INSA does not provide its own autocomplete
- FR3.4: Dispatch to `fetchInsaRouting()` when INSA is selected, otherwise dispatch to `fetchRouting()` with resolved OTP config
- FR3.5: In comparison mode, dispatch INSA and OTP requests in parallel and collect results per environment
- FR3.6: INSA results are interchangeable with OTP results across all comparison layouts (timeline, Gantt, detail view)
- FR3.7: Configure API URL and access ID via environment variables with sensible defaults
- FR3.8: Hide INSA from the environment selector on non-routing tabs (Stop Monitor, NearbySearch, Autocomplete) — INSA only supports routing
- FR3.9: Auto-deselect INSA when switching to a non-routing tab; fall back to PROD if it was the only selection

#### FR4 — INSA Results Display & Pagination
- FR4.1: Display a raw/normalized JSON toggle when viewing INSA results — "Normalized" shows the OTP-shaped response, "Raw" shows the original HAFAS response
- FR4.2: Default to the Normalized view; toggle only visible for INSA results
- FR4.3: Copy JSON button respects the toggle — copies the appropriate response format
- FR4.4: INSA route polylines render using the existing map components with no special handling
- FR4.5: Support INSA earlier/later pagination via native HAFAS scroll tokens (`scrB`/`scrF`) instead of OTP's time-shift approach
- FR4.6: Preserve scroll tokens across pagination — updating one direction does not lose the other direction's token
- FR4.7: Merge and deduplicate paginated results, capping at 20 itineraries, sliding the window in the scroll direction

---

## Non-Functional Requirements

#### NFR1 — Codebase Restructuring
- NFR1.1: Centralize shared types into `src/lib/types/` with domain modules and barrel export — eliminating reverse dependencies where `lib/` imported from `components/`
- NFR1.2: Restructure `src/lib/` into domain subdirectories: `api/`, `utils/`, `state/`, `hooks/`
- NFR1.3: Restructure `src/components/` into domain subdirectories: `layout/`, `routing/`, `comparison/`, `map/`, `shared/`, `stop-monitor/`, `nearby-search/`
- NFR1.4: Extract 6 domain hooks from page.tsx (956 → 250 lines): `useEnvironment`, `useRouting`, `useComparison`, `useStopMonitor`, `useNearbySearch`, `useUrlStateSync`
- NFR1.5: Group 48 flat `EvaluationArea` props into 4 typed domain bag objects: `RoutingViewData`, `ComparisonViewData`, `StopMonitorViewData`, `NearbySearchViewData`
- NFR1.6: Extract reusable components to eliminate duplication: `ComparisonCardShell` (3 usages), `ConfirmDialog` (2 usages), `RequestHistoryPanel`, consolidated `JsonHighlighted`

#### NFR2 — Testing
- NFR2.1: 121 unit tests for the INSA module — client (23), convert (41), utils (57)
- NFR2.2: Covers request building, error handling, timeout, pagination, DST-aware parsing, products bitmask, polyline decoding, response normalization, and edge cases
- NFR2.3: Uses shared test fixtures following the existing `Partial<T>` override pattern

#### NFR3 — Cross-Column Timeline Alignment
- NFR3.1: Fix comparison timeline misalignment where overlap-prevention pushed cards independently per column, causing the same itinerary to appear at different Y positions across environments
- NFR3.2: Implement cross-column position computation that aligns itineraries with the same start minute across all environment columns
- NFR3.3: Floor timestamps to the start of the minute so times differing only in seconds align correctly

#### NFR4 — Framework & Security
- NFR4.1: Migrate to Next.js 16 `proxy.ts` convention for locale detection and routing
- NFR4.2: Fix 3 known security vulnerabilities via npm audit (Next.js, flatted, undici)
- NFR4.3: Update project documentation to reflect current test coverage (474 unit tests, 40 E2E tests)
