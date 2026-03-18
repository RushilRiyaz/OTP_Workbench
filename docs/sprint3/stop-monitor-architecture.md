# Stop Monitor — Component Architecture

> **Sprint 3** · OTP Client v2.0 · Ayman Kandouli

---

## Architecture Overview

```mermaid
graph TD
    %% ── Nodes ──────────────────────────────────────────────

    Form["<b>StopMonitorForm</b><br/><i>FR18</i><br/>Stop search · Date/Time<br/>Arr/Dep filters · Submit"]
    Map["<b>StopMonitorMapView</b><br/>Leaflet map<br/>Debounced bounds fetch<br/>StopMarkers (H icons)"]
    State["<b>page.tsx</b><br/><i>Central State Hub</i><br/>Promise.allSettled()<br/>Multi-env orchestration"]
    API["<b>stopMonitor.ts</b><br/><i>API Client</i><br/>Monitor & stops endpoints<br/>Timeout · error handling"]
    Config["<b>EnvironmentSelector.tsx</b><br/><i>Environment Config</i><br/>Resolves Stop Monitor URL<br/>per environment"]
    Results["<b>StopMonitorResults</b><br/><i>FR19 – FR21</i><br/>Multi-env departure board<br/>Board/JSON · Synced scroll<br/>Delays · Alerts · Badges"]
    External[("<b>LVB Stop Monitor API</b><br/>PROD · STAGE · DEV")]

    %% ── Edges ──────────────────────────────────────────────

    Form -- "params + submit" --> State
    Map -- "selected stop" --> State
    Map -- "stop bounds query" --> API
    State -- "monitor request<br/>per environment" --> API
    Config -. "derives URL" .-> API
    API -- "HTTP GET / JSON" --> External
    External -- "MonitorItem[]" --> API
    State -- "results state" --> Results

    %% ── Styles ─────────────────────────────────────────────

    classDef ui fill:#EEF2FF,stroke:#818CF8,stroke-width:2px,color:#1e1b4b
    classDef state fill:#FFF7ED,stroke:#FB923C,stroke-width:2px,color:#431407
    classDef api fill:#F0FDF4,stroke:#4ADE80,stroke-width:2px,color:#14532d
    classDef ext fill:#FEF2F2,stroke:#F87171,stroke-width:2px,color:#7f1d1d
    classDef map fill:#F0F9FF,stroke:#38BDF8,stroke-width:2px,color:#0c4a6e

    class Form,Results ui
    class State state
    class API,Config api
    class External ext
    class Map map
```

### Legend

- **Purple** — UI Components (StopMonitorForm, StopMonitorResults)
- **Orange** — State Management (page.tsx)
- **Green** — API & Config (stopMonitor.ts, EnvironmentSelector.tsx)
- **Blue** — Interactive Map (StopMonitorMapView, StopMarkers)
- **Red** — External Service (LVB Stop Monitor API)

---

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as StopMonitorForm
    participant M as StopMonitorMapView
    participant P as page.tsx
    participant A as stopMonitor.ts
    participant E as LVB API (PROD/STAGE/DEV)
    participant R as StopMonitorResults

    U ->> M: Click "H" marker on map
    M ->> P: Selected stop + stop_id
    U ->> F: Set date/time & filters
    F ->> P: Form parameters
    U ->> F: Click "Monitor"
    P ->> A: Monitor request × N envs
    A ->> E: HTTP GET (per environment)
    E -->> A: MonitorItem[] (JSON)
    A -->> P: Results (Promise.allSettled)
    P ->> R: Render departure board
```

---

## Functional Requirements

| FR | Title | Description |
|----|-------|-------------|
| **FR18** | Stop Monitor Form | Stop search (autocomplete + map click), date/time picker, arrival-only / departure-only filters |
| **FR19** | Departure Board | Multi-environment departure board with realtime delays and cancellation badges |
| **FR20** | View Toggle | Board / JSON view toggle, copy JSON to clipboard, synchronized scroll across env columns |
| **FR21** | Detail Display | Track changes, service alerts with category badges, per-environment labels |

---

## Key Components

```mermaid
graph LR
    subgraph UI ["UI Layer"]
        direction TB
        SMF["StopMonitorForm<br/><code>components/StopMonitorForm.tsx</code>"]
        SMR["StopMonitorResults<br/><code>components/StopMonitorResults.tsx</code>"]
    end

    subgraph MapLayer ["Map Layer"]
        direction TB
        SMV["StopMonitorMapView<br/><code>components/map/StopMonitorMapView.tsx</code>"]
        SM["StopMarkers<br/><code>components/map/StopMarkers.tsx</code>"]
    end

    subgraph Logic ["API & State Layer"]
        direction TB
        ST["stopMonitor.ts<br/><code>lib/stopMonitor.ts</code>"]
        GC["EnvironmentSelector<br/><code>components/EnvironmentSelector.tsx</code>"]
        PG["page.tsx<br/><code>app/[locale]/page.tsx</code>"]
    end

    classDef ui fill:#EEF2FF,stroke:#818CF8,stroke-width:2px,color:#1e1b4b
    classDef map fill:#F0F9FF,stroke:#38BDF8,stroke-width:2px,color:#0c4a6e
    classDef api fill:#F0FDF4,stroke:#4ADE80,stroke-width:2px,color:#14532d
    classDef state fill:#FFF7ED,stroke:#FB923C,stroke-width:2px,color:#431407
    classDef group fill:none,stroke:#d1d5db,stroke-width:1px,stroke-dasharray:5,color:#6b7280

    class SMF,SMR ui
    class SMV,SM map
    class ST,GC api
    class PG state
    class UI,MapLayer,Logic group
```

---

## Additional Sprint 3 Deliverables

| Area | Detail |
|------|--------|
| **E2E Tests** | 8 new Selenium tests for Stop Monitor (40 total), GitHub Actions CI |
| **i18n** | Full EN/DE translations for all Stop Monitor UI via `next-intl` |
| **Unit Tests** | Stop Monitor form visibility, submission, and results handling |
