# OTP Client v2 — High-Level System Architecture

**Project:** LVB OTP Routing Workbench
**Version:** Sprint 2 (Feb 2026)
**Audience:** Stakeholders, Product Owners, Technical Leads
**Status:** Current — reflects all completed FRs through Sprint 2
**Architecture Type:** Layered Client-Side SPA (Browser-Native N-Tier)

---

## Overview

The OTP Client v2 is a browser-based internal tool for LVB routing developers to **test, inspect, and compare** routing API responses across deployment environments. The application is a single-page Next.js client that communicates directly with LVB backend services.

**Key characteristics:**

- Desktop-only, internal tool (~5 routing developers)
- All logic runs in the browser — no backend/BFF layer
- State is managed centrally in a single React component (`page.tsx`)
- Supports up to 3 simultaneous environments for side-by-side comparison (Sprint 2/3)

---

## System Architecture Diagram

```mermaid
flowchart TB
    classDef actor       fill:#2C3E50,stroke:#1A252F,color:#FFFFFF,font-weight:bold
    classDef paramComp   fill:#2471A3,stroke:#154360,color:#FFFFFF
    classDef evalComp    fill:#117A65,stroke:#0B5345,color:#FFFFFF
    classDef stateHub    fill:#FBC10F,stroke:#B8860B,color:#1A1A1A,font-weight:bold
    classDef libNode     fill:#1E8449,stroke:#145A32,color:#FFFFFF
    classDef storageNode fill:#7D3C98,stroke:#5B2C6F,color:#FFFFFF
    classDef externalApi fill:#BA4A00,stroke:#7E5109,color:#FFFFFF

    DEV(["👤  LVB Routing Developer"])

    subgraph APP["OTP Client v2  —  Next.js 16 + React 19"]
        direction TB

        subgraph PARAM_AREA["Parameter Area"]
            direction TB
            PA1["Environment Selector"]
            PA2["Journey Form"]
            PA3["Routing Options"]
        end

        HUB["State Hub  —  page.tsx"]

        subgraph EVAL_AREA["Evaluation Area"]
            direction TB
            EA1["Tab Navigation"]
            EA2["Interactive Map"]
            EA3["Results Panel"]
        end

        subgraph INFRA["Infrastructure Layer"]
            direction LR
            subgraph LIBS["Utility Libraries"]
                L1["Routing Client"]
                L2["Autocomplete Client"]
                L3["Validation / History / Utils"]
            end
            subgraph STORAGE["Browser Storage"]
                S1["Request History"]
                S2["Location History"]
                S3["Theme Preference"]
            end
        end
    end

    subgraph EXT["External Services"]
        direction LR
        EXT1["OTP Routing API\nPROD / STAGE / DEV"]
        EXT2["Autocomplete API"]
        EXT3["Nominatim\nReverse Geocoding"]
    end

    DEV                 -->|"uses"| APP
    PARAM_AREA          <-->|"props / callbacks"| HUB
    EVAL_AREA           <-->|"props / callbacks"| HUB
    HUB                 --> INFRA
    L1                  -->|"GraphQL POST"| EXT1
    L2                  -->|"REST GET"| EXT2
    EA2                 -->|"REST GET"| EXT3

    class DEV actor
    class PA1,PA2,PA3 paramComp
    class EA1,EA2,EA3 evalComp
    class HUB stateHub
    class L1,L2,L3 libNode
    class S1,S2,S3 storageNode
    class EXT1,EXT2,EXT3 externalApi
```

---

## Color Legend

| Color | Layer | Description |
|:------|:------|:------------|
| **Dark Charcoal** | Actor | End user (LVB routing developer) |
| **Blue** | Parameter Area | Input components — environment, journey, routing options |
| **Green (teal)** | Evaluation Area | Output components — map, results, comparison |
| **LVB Yellow** | State Hub | `page.tsx` — central state management, all props flow through here |
| **Green** | Library Layer | Utility modules — API clients, validation, formatters, hooks |
| **Purple** | Browser Storage | `localStorage` — persisted request history, location history, theme |
| **Orange** | External Services | LVB APIs and third-party services called directly from the browser |

---

## Functional Requirements Coverage

| FR | Feature | Sprint | Area |
|:---|:--------|:-------|:-----|
| FR2 | Application layout (Parameter + Evaluation Areas) | 1 | App Shell |
| FR3 | Environment selection — PROD/STAGE/DEV + custom | 1 | Parameter Area |
| FR4 | Journey definition — locations, date/time | 1 | Parameter Area |
| FR5 | Routing options — modes, timing, optional params | 1 | Parameter Area |
| FR6 | Request handling — submit, validate, history, shareable links | 1 | State Hub |
| FR7 | Parameter area collapse/expand | 1 | Parameter Area |
| FR8 | Interactive map — click to set, cursor coords, copy popup | 1 | Evaluation Area |
| FR9 | Results layout — toggle + draggable split view | 2 | Evaluation Area |
| FR10 | Results overview — itinerary list with transfer scheme | 2 | Evaluation Area |
| FR11 | Itinerary detail — stops, realtime, tariff zones, leg hover | 2 | Evaluation Area |
| FR12 | Advanced info — JSON viewer, copy, earlier/later pagination | 2 | Evaluation Area |
| FR13 | Routing comparison — up to 3 environments | 2 | State Hub + Evaluation Area |
| FR14 | Comparison interaction — hover/select, map sync | 2 | State Hub + Evaluation Area |
| FR15 | Vertical timeline layout | 2 | Evaluation Area |
| FR16 | Horizontal Gantt overview | 2 | Evaluation Area |

---

## Key Architecture Decisions

| Decision | Rationale |
|:---------|:----------|
| **No backend / BFF layer** | Internal tool; API keys acceptable in `.env`; no public exposure |
| **State lifted to `page.tsx`** | Single source of truth; simplifies map ↔ form coordination and comparison mode |
| **Client components only** (`"use client"`) | Leaflet requires DOM; all components are interactive; no SSR penalty needed |
| **Per-environment API calls** | `fetchRouting()` accepts `{ baseUrl, apiKey }` options — no global config |
| **localStorage for persistence** | No user accounts; browser storage is sufficient for history and preferences |
| **Dual environment selection** | OTP routing env and Autocomplete env can differ (e.g., STAGE routing + PROD autocomplete) |
| **URL state sync** | All form state serialised to query params — enables shareable links without a backend |
