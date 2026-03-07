# Stop Monitor — Functional & Non-Functional Requirements

**Sprint**: 3
**Feature**: Stop Monitor (Comparison)
**Owner**: Ayman Kandouli
**Source**: Stakeholder requirements document "Additional Requirements OTP Workbench" §2
**API**: `https://api.lmservices.mobilityinnovate.net/api/stopMonitor` (same API key as routing)
**API Docs**: `docs/api_docs/stop_monitor_api.md`, `docs/api_docs/stop_monitor_api_docs.json`

---

## Overview

The Stop Monitor use case activates the existing `stopmonitor` tab placeholder and provides a
real-time departure/arrival board for any public transport stop. Developers can select 1–3
environments and inspect the same stop side-by-side to compare API results across PROD, STAGE,
DEV, or any custom environment. The feature mirrors the comparison model established in the
Routing Comparison tab.

---

## Functional Requirements

### FR18 — Stop Monitor Parameter Area

The Parameter Area for the Stop Monitor tab provides all inputs needed to construct and submit a
`GET /monitor` request.

| ID | Requirement |
|----|-------------|
| FR18.1 | Display an environment selector that supports selecting **1 to 3 environments** (reuse `EnvironmentSelector` in multi-select mode — identical to Routing Comparison). |
| FR18.2 | Display a **stop name input** field that suggests results from the LVB Autocomplete API as the user types (reuse `LocationInput` in autocomplete-only mode; stop ID entry also accepted). |
| FR18.3 | Display a **date and time** input field (reuse `DateTimeInput`, including the "Now" button). |
| FR18.4 | Display an **"Arrivals only"** checkbox. When checked, the request is sent with `arrOnly=true`. |
| FR18.5 | Display a **"Departures only"** checkbox. When checked, the request is sent with `depOnly=true`. |
| FR18.6 | "Arrivals only" and "Departures only" are **mutually exclusive**: checking one automatically unchecks the other. When neither is checked, both arrivals and departures are returned (default API behaviour). |
| FR18.7 | Display a **Submit button**. On click, validate inputs and trigger parallel API calls for all selected environments. |
| FR18.8 | **Validate** mandatory inputs before submission: stop and date/time are required. Display inline error messages if missing (consistent with existing validation pattern in `validation.ts`). |

---

### FR19 — Stop Monitor Results Display

The Evaluation Area shows a real-time departure/arrival board. Layout mirrors the side-by-side
comparison layout from the Routing Comparison tab.

#### FR19.1 — Column Layout

| ID | Requirement |
|----|-------------|
| FR19.1.1 | Display **one column per selected environment**, arranged side-by-side horizontally. |
| FR19.1.2 | Each column header shows the **stop name** and an **environment badge** (e.g. "PROD", "STAGE"). |
| FR19.1.3 | Display the **query date** below the column header (formatted as human-readable date, e.g. "Di. 03.03.2026"). |
| FR19.1.4 | Show a **loading spinner** per column while the request is in progress (independent per environment — one column can load while another has results). |
| FR19.1.5 | Show an **error state** per column if the request fails (consistent with existing routing error display). |

#### FR19.2 — Departure/Arrival Entry

Each row in the board represents one `monitorItem` from the API response.

| ID | Requirement |
|----|-------------|
| FR19.2.1 | Display the **scheduled departure time** (`HH:MM`) for each entry. |
| FR19.2.2 | If a delay is present (`departure_delay` ≠ null and ≠ 0), display the **realtime departure time** alongside the scheduled time, and show a **delay badge** (e.g. `+3 min` in red for late, `-1 min` in green for early). Delay values are in seconds — convert to minutes for display (reuse `formatDelay()` from `legUtils.ts`). |
| FR19.2.3 | Display a **route badge** styled with the `route_color` from the API, containing the `transport_type` icon/label and the `line` number (e.g. a red pill showing "Str 11"). |
| FR19.2.4 | Display the **`trip_headsign`** (destination direction) to the right of the route badge. |
| FR19.2.5 | Display **cancelled** entries with a clear visual indicator: strikethrough on the time and a "Cancelled" label. Distinguish between `trip_cancelled` (entire trip) and `stop_cancelled` (this stop only). |
| FR19.2.6 | Entries are **sorted by departure time ascending**. |

#### FR19.3 — "More" Button

| ID | Requirement |
|----|-------------|
| FR19.3.1 | Display a **"More"** button at the bottom of each column's results list. |
| FR19.3.2 | Clicking "More" extends the results time window by **60 minutes** (increments the `minutes` API parameter by 60) and re-fetches, **appending** new entries to the existing list (no full reload). Duplicate entries (same `trip_id` + `stop_id`) are deduplicated. |
| FR19.3.3 | The "More" button is **per-column** — extending one environment's results does not affect others. |

---

### FR20 — Stop Monitor JSON View

| ID | Requirement |
|----|-------------|
| FR20.1 | Provide a **toggle** to switch between the departure board view and a **raw JSON view** (consistent with the JSON toggle in `RoutingResults`). |
| FR20.2 | The JSON view displays the **full API response** for the selected/active column (or all columns if in comparison mode). |
| FR20.3 | Provide a **"Copy JSON"** button with visual feedback on success/failure (reuse existing copy pattern from `RoutingResults`). |

---

### FR21 — Stop Monitor Additional Entry Details

| ID | Requirement |
|----|-------------|
| FR21.1 | Display **service alerts** attached to an entry (`alerts[]`). Show the alert category and header text. Use existing `formatAlertCategory()` from `legUtils.ts`. |
| FR21.2 | Display **track information** when available: show `track` (realtime) and `track_scheduled` if they differ, indicating a track change (e.g. "Track A → B"). |

---

## Non-Functional Requirements

### NFR-SM1 — API Client

| ID | Requirement |
|----|-------------|
| NFR-SM1.1 | Implement a dedicated `src/lib/stopMonitor.ts` API client that accepts `{ baseUrl, apiKey }` options — consistent with `fetchRouting()` and `searchLocations()` patterns. |
| NFR-SM1.2 | Apply a **30-second timeout** using `AbortController` (consistent with `fetchRouting`). |
| NFR-SM1.3 | **Log all requests and responses to the browser console** for developer debugging (consistent with project-wide logging policy). |
| NFR-SM1.4 | On API failure or timeout, surface a structured error object and display UI feedback in the affected column (consistent with existing `RoutingError` pattern). |

### NFR-SM2 — Environment Configuration

| ID | Requirement |
|----|-------------|
| NFR-SM2.1 | Resolve Stop Monitor API base URL and API key via the existing `getEnvironmentConfig()` / `getAutocompleteConfig()` infrastructure. No hard-coded URLs. |
| NFR-SM2.2 | The Stop Monitor tab uses the **same API key** as routing and autocomplete (confirmed by stakeholder). |

### NFR-SM3 — Component Reuse

| ID | Requirement |
|----|-------------|
| NFR-SM3.1 | Reuse `EnvironmentSelector` (multi-select mode), `LocationInput` (autocomplete-only), and `DateTimeInput` — no duplication of existing components. |
| NFR-SM3.2 | Reuse `legUtils.ts` formatting utilities (`formatDelay`, `formatTimestamp`, `formatAlertCategory`) for consistent display. |
| NFR-SM3.3 | Reuse `useIsDark()` hook for dark mode — do not introduce per-component dark mode detection. |

### NFR-SM4 — State Management

| ID | Requirement |
|----|-------------|
| NFR-SM4.1 | All Stop Monitor state is **lifted to `page.tsx`** and passed down as props — consistent with the existing state management pattern. No local component state for shared data. |
| NFR-SM4.2 | Stop Monitor results are **isolated from routing results** — switching tabs does not clear or overwrite the other tab's state. |

### NFR-SM5 — Performance & UX

| ID | Requirement |
|----|-------------|
| NFR-SM5.1 | API calls for multiple environments are made **in parallel** (independent `Promise` calls), not sequentially. |
| NFR-SM5.2 | Each column shows a **loading state independently** — a slow environment does not block the display of a fast one. |
| NFR-SM5.3 | Autocomplete suggestions in the stop input are **debounced at 300ms** (consistent with existing `LocationInput`). |

### NFR-SM6 — Testing

| ID | Requirement |
|----|-------------|
| NFR-SM6.1 | The `stopMonitor.ts` API client is unit-tested in `src/lib/__tests__/stopMonitor.test.ts`, covering: successful response parsing, timeout handling, error responses (4xx/5xx), and parallel multi-environment calls. |
| NFR-SM6.2 | Add shared test fixtures for `monitorItem` and `stopsItem` to `src/test/fixtures.ts` using the existing `Partial<T>` override pattern. |
| NFR-SM6.3 | Add at least 1 E2E test covering the Stop Monitor happy path: select stop, submit, verify results column renders. |

---

## API Mapping Summary

Maps stakeholder requirements to concrete Stop Monitor API parameters:

| Stakeholder Requirement | API Parameter | Endpoint |
|------------------------|---------------|----------|
| Stop name input | `stopid` (stop ID resolved from autocomplete) | `GET /monitor` |
| Date/Time | `date` (YYYYMMDD) + `time` (HH:MM) | `GET /monitor` |
| Arrivals only checkbox | `arrOnly=true` | `GET /monitor` |
| Departures only checkbox | `depOnly=true` | `GET /monitor` |
| "More" button | Increment `minutes` by 60 | `GET /monitor` |
| Environment comparison | Parallel calls per env with respective `baseUrl` + `apiKey` | `GET /monitor` |
| Route badge color | `route_color` (hex, no `#` prefix — must prepend) | `monitorItem` |
| Delay display | `departure_delay` (seconds → minutes) | `monitorItem` |
| Cancellation indicator | `trip_cancelled` / `stop_cancelled` | `monitorItem` |
| Alerts | `alerts[]` → `alertCategory` + `alertHeaderText` | `monitorItem` |
| Track change | `track` vs `track_scheduled` | `monitorItem` |

---

## Out of Scope (Sprint 3)

The following API capabilities are documented but not required for this sprint:

- `POST /monitor` filter by line/agency/direction — may be considered for a future sprint
- `POST /directionInfo/{stopId}` — lines/headsigns lookup (not needed for basic board)
- `POST /stopTimes` — full trip timeline on click (not requested by stakeholder)
- Map visualisation of stop location — not mentioned in stakeholder requirements

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should the stop input support coordinate-based lookup (`koord=lat,lon`) in addition to stop ID? The API accepts both. | To clarify with stakeholder |
| 2 | What is the default `minutes` window on initial load? (API default is 60.) | Assume 60 unless stakeholder specifies |
| 3 | Should the "Arrivals only" / "Departures only" filters be per-column (different per env) or global across all columns? | Assume global (same filter for all envs) |
| 4 | Should results scroll independently per column or lock-scroll together? | To clarify with stakeholder |
