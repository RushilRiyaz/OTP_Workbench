# Stop Monitor API Documentation

> Generated from `stop_monitor_api_docs.json` (OpenAPI spec v20251216)

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [GET /monitor](#1-get-monitor)
  - [POST /monitor](#2-post-monitor)
  - [POST /directionInfo/{stopId}](#3-post-directioninfostopid)
  - [GET /stops](#4-get-stops)
  - [POST /stopTimes](#5-post-stoptimes)
- [Schemas — Data Objects](#schemas--data-objects)
  - [monitorItem](#monitoritem)
  - [directionItem](#directionitem)
  - [directionInfoRequestItem](#directioninforequestitem)
  - [tripInfo](#tripinfo)
  - [stopTimesResponse](#stoptimesresponse)
  - [stopTimesItem](#stoptimesitem)
  - [stopsItem](#stopsitem)
  - [coordinate](#coordinate)
  - [alert](#alert)
- [Schemas — Array Wrappers](#schemas--array-wrappers)
- [Schemas — Primitive Types](#schemas--primitive-types)
- [Schema Relationship Diagram](#schema-relationship-diagram)
- [Schema Cross-Reference](#schema-cross-reference)
- [Notable Quirks & Inconsistencies](#notable-quirks--inconsistencies)

---

## Overview

| Field | Value |
|---|---|
| **Title** | Stop Monitor |
| **Version** | v20251216 |
| **Base URL** | `https://api.lmservices.mobilityinnovate.net/api/stopMonitor` |
| **Protocol** | HTTPS, REST (GET/POST) |
| **Response Format** | `application/json` |
| **Endpoints** | 4 paths, 5 methods |
| **Schemas** | 19 |

The API provides real-time departure/arrival information for public transport stops, including trip schedules, delays, cancellations, track changes, wheelchair accessibility, and service alerts.

**Supported transport types**: Tram, Bus, S-Bahn, Bahn (Regionalbahn/Regionalexpress), Schienenersatzverkehr (rail replacement bus), Ruf-Bus (on-demand bus).

---

## Authentication

| Header | Value |
|---|---|
| `X-API-Key` | Required on all endpoints. Rate-limited API key. |

---

## Endpoints

### 1. GET /monitor

```
GET /monitor
```

Full URL: `https://api.lmservices.mobilityinnovate.net/api/stopMonitor/monitor`

**Summary**: Shows all trips at a given stop, date and time.

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `stopid` | query | string | **Yes** | — | Stop ID (e.g. `"0011078_parent"`). Also accepts coordinate via `koord=51.3243,12.3336` |
| 3 | `date` | query | string | **Yes** | — | Date to query. Format: `YYYYMMDD`. If no `time` param, returns whole day. |
| 4 | `time` | query | string | No | — | Time to query. Format: `HH:MM` |
| 5 | `minutes` | query | string | No | `60` | Results with arrival_time not later than `minutes` after `time` |
| 6 | `max_items` | query | string | No | all | Max number of results |
| 7 | `min_items` | query | string | No | `0` | Minimum results. If set, `minutes` is enlarged (max 3 days) until minimum reached |
| 8 | `mockup` | query | string | No | — | Returns fixed test data modelling special cases |
| 9 | `depOnly` | query | boolean | No | — | Only departures (excludes trips with final stop at given stopid) |
| 10 | `arrOnly` | query | boolean | No | — | Only arrivals (excludes trips with first stop at given stopid) |

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `monitorInfo` → array of `monitorItem` |

---

### 2. POST /monitor

```
POST /monitor
```

**Summary**: Same as GET but with filter options.

**Description**: Get departure details filtered by line, direction and agency. Response adds `agencyName` and `directionId` keys compared to GET.

#### Parameters

Same 10 parameters as GET /monitor.

#### Request Body (`application/json`)

Inline filter object:

| Property | Type | Description |
|---|---|---|
| `line` | string[] | Line filter |
| `agencyName` | string[] | Agency name filter |
| `directionId` | string[] | Direction ID filter |
| `transportTypes` | string[] | Transport type filter |

**Example** ("Tram 11"):
```json
{
  "line": ["11"],
  "agencyName": ["Leipziger Verkehrsbetriebe"],
  "directionId": ["0", "1"],
  "transportTypes": ["Tram"]
}
```

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `monitorInfo` → array of `monitorItem` |

---

### 3. POST /directionInfo/{stopId}

```
POST /directionInfo/{stopId}
```

**Summary**: Get all lines and headsigns at a stop, grouped by direction.

#### Parameters

| # | Name | Location | Type | Required | Description |
|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | Rate-limited API key |
| 2 | `stopId` | path | string | **Yes** | Stop ID (e.g. `"0013000_parent"`) |

#### Request Body (`application/json`)

`oneOf`: a single `directionInfoRequestItem` or an array of `directionInfoRequestItem`.

See [directionInfoRequestItem](#directioninforequestitem) for schema.

#### Responses

| Code | Description | Schema |
|---|---|---|
| 200 | Array of lines | `directionInfo` → array of `directionItem` |
| 400 | Invalid input | `{ error: string }` |
| 500 | Server error | `{ error: string }` |

---

### 4. GET /stops

```
GET /stops
```

**Summary**: Returns all stations within a bounding box, ordered by priority.

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `bb` | query | string | Effectively yes | — | Bounding box: `lon1,lat1,lon2,lat2` (e.g. `"51.1,12.5,51.3,12.9"`) |
| 3 | `order_by` | query | string | No | `"Priority"` | `"Name"` (alphabetical) or `"Priority"` (traffic importance) |
| 4 | `maxlen` | query | integer | No | no limit | Max stations returned. Minimum: 0. |

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `stopsInfo` → array of `stopsItem` |

---

### 5. POST /stopTimes

```
POST /stopTimes
```

**Summary**: All stop times for a trip.

**Description**: Get all stop times belonging to a specified trip.

#### Parameters

| # | Name | Location | Type | Required | Description |
|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | Rate-limited API key |

#### Request Body (`application/json`, **required**)

| Property | Type | Required | Description | Example |
|---|---|---|---|---|
| `tripId` | string | **Yes** | Trip ID | — |
| `stopId` | string | No | Current stop ID | — |
| `afterStopSequence` | number | No | After which stop sequence to look for stop ID | — |
| `arrivalTime` | dateTimeString | No | Arrival time (Europe/Berlin) | `"2022-12-01 17:23:12"` |
| `departureTime` | dateTimeString | No | Departure time (Europe/Berlin) | `"2022-12-01 17:23:12"` |
| `serviceDate` | dateString | No | Service date | `"20221201"` |

**Examples**:
- `{ "tripId": "abc", "serviceDate": "20260206" }`
- `{ "tripId": "abc", "stopId": "0013000_parent", "arrivalTime": "2022-12-01 17:23:00" }`

#### Responses

| Code | Description | Schema |
|---|---|---|
| 200 | Success | `stopTimesResponse` |
| 400 | Invalid input | `{ error: string }` |
| 500 | Server error | `{ error: string }` |

---

## Schemas — Data Objects

### monitorItem

Individual departure/arrival at a stop. Returned by both GET and POST `/monitor`.

**Required**: all 25 properties (plus phantom `stop_accessible` — see [Quirks](#notable-quirks--inconsistencies))

| Property | Type | Nullable | Description | Example |
|---|---|---|---|---|
| `arrival_time` | timeString | No | Arrival time `HH:MM:SS` | `"17:23:12"` |
| `date` | dateString | No | Arrival date `YYYYMMDD` | `"20221201"` |
| `departure_time` | timeString | No | Departure time | `"17:23:12"` |
| `departure_date` | dateString | No | Departure date | `"20221201"` |
| `trip_id` | string | No | Trip identifier | `"lvb05517STRB__20221130"` |
| `stop_id` | string | No | Stop ID (used in routing) | `"1000101"` |
| `parent_id` | string | No | Parent station stop_id (used in autocomplete) | `"0013000_parent"` |
| `route_id` | string | No | Route identifier | `"LVTRAM11"` |
| `trip_headsign` | string | No | Destination headsign | `"Wahren"` |
| `route_color` | string | No | Hex color for route display | `"BB1E10"` |
| `directionId` | string | No | Direction: `"0"` or `"1"` | `"0"` |
| `agencyName` | string | No | Transit agency name | `"Leipziger Verkehrsbetriebe"` |
| `trip_cancelled` | boolean | No | True if entire trip cancelled | `false` |
| `stop_cancelled` | boolean | No | True if only this stop cancelled | `true` |
| `trip_accessible_scheduled` | boolean | **Yes** | Planned wheelchair accessibility (null = no info) | `false` |
| `trip_accessible` | boolean | **Yes** | Realtime wheelchair accessibility (null = no info) | `true` |
| `track_scheduled` | string | **Yes** | Scheduled track (null = unknown) | `"A"` |
| `track` | string | **Yes** | Realtime track (null = unknown) | `"A"` |
| `delay_time` | integer | **Yes** | Arrival delay in seconds (+late, -early, null = no info) | `60` |
| `departure_delay` | integer | **Yes** | Departure delay in seconds | `60` |
| `waiting_time` | integer | No | Minutes from request time to arrival (negative = past) | — |
| `dep_waiting_time` | integer | No | Minutes from request time to departure (negative = past) | — |
| `alerts` | alert[] | No | Alerts for this stop or trip | — |
| `transport_type` | string | No | `Tram`, `Bus`, `S-Bahn`, `Bahn`, `Schienenersatzverkehr`, `Ruf-Bus` | `"Tram"` |
| `line` | string | No | Line identifier | `"16"` |

---

### directionItem

Route/direction info for a stop. Returned by `POST /directionInfo/{stopId}`.

**Required**: all 7 properties

| Property | Type | Description | Example |
|---|---|---|---|
| `directionId` | string | `"0"` or `"1"` | `"0"` |
| `agencyName` | string | Agency name | `"Leipziger Verkehrsbetriebe"` |
| `line` | string | Line identifier | `"16"` |
| `route_color` | string | Hex color | `"BB1E10"` |
| `directionName` | string | Direction description | `"Richtung Taucha"` |
| `transport_type` | string | Transport type | `"Tram"` |
| `headsigns` | string[] | All headsigns for this line at this stop | `["Gohlis, Landsberger Str.", "Hauptbahnhof"]` |

---

### directionInfoRequestItem

Filter criteria for direction info requests.

No required properties.

| Property | Type | Description |
|---|---|---|
| `line` | string[] | Line filter |
| `agencyName` | string[] | Agency name filter |
| `directionId` | string[] | Direction ID filter |
| `transportTypes` | string[] | Transport type filter |
| `stopId` | string | Only if not provided in path parameter |

---

### tripInfo

Trip metadata. Part of `stopTimesResponse`.

**Required**: all 12 properties

| Property | Type | Nullable | Description | Example |
|---|---|---|---|---|
| `trip_id` | string | No | Trip identifier | `"lvb05517STRB__20221130"` |
| `service_date` | string | No | GTFS service date (may differ from first-stop date) | `"20221205"` |
| `route_id` | string | No | Route identifier | `"LVTRAM11"` |
| `route_color` | string | No | Hex color | `"BB1E10"` |
| `directionId` | string | No | `"0"` or `"1"` | `"0"` |
| `agencyName` | string | No | Agency name | `"Leipziger Verkehrsbetriebe"` |
| `default_headsign` | string | No | Default headsign (may change at specific stops) | `"Wahren"` |
| `trip_cancelled` | boolean | No | True if entire trip cancelled | `false` |
| `trip_accessible_scheduled` | boolean | **Yes** | Planned wheelchair accessibility | `false` |
| `trip_accessible` | boolean | **Yes** | Realtime wheelchair accessibility | `true` |
| `transport_type` | string | No | Transport type | `"Tram"` |
| `line` | string | No | Line identifier | `"16"` |

---

### stopTimesResponse

Response for `POST /stopTimes`.

**Required**: all 6 properties

| Property | Type | Description |
|---|---|---|
| `tripInfo` | tripInfo | Trip metadata |
| `beforeGivenStop` | stopTimesItem[] | Stops before the specified stop |
| `atGivenStop` | stopTimesItem | The specified stop (single object, not array) |
| `afterGivenStop` | stopTimesItem[] | Stops after the specified stop |
| `beforeShape` | coordinate[] | Shape coordinates before the stop |
| `afterShape` | coordinate[] | Shape coordinates after the stop |

---

### stopTimesItem

A single stop-time entry within a trip.

**Required**: 16 properties (plus phantoms `waiting_time`, `dep_waiting_time` — see [Quirks](#notable-quirks--inconsistencies))

| Property | Type | Nullable | Required | Description | Example |
|---|---|---|---|---|---|
| `arrival_time` | timeString | No | Yes | Arrival time `HH:MM:SS` | `"17:23:12"` |
| `date` | dateString | No | Yes | Date `YYYYMMDD` | `"20221201"` |
| `departure_time` | timeString | No | Yes | Departure time | `"17:23:12"` |
| `departure_date` | dateString | No | Yes | Departure date | `"20221201"` |
| `stop_id` | string | No | Yes | Stop identifier | `"1000101"` |
| `stop_lat` | number | No | No | Stop latitude | `51.37` |
| `stop_lon` | number | No | No | Stop longitude | `12.38` |
| `parent_id` | string | No | Yes | Parent station stop_id | `"0013000_parent"` |
| `stop_name` | string | No | No | Parent stop name (or stop name) | `"Leipzig, Hauptbahnhof (Tram/Bus)"` |
| `stop_sequence` | number | No | No | Order within the trip | `3` |
| `trip_headsign` | string | No | Yes | Headsign at this stop | `"Wahren"` |
| `stop_accessible` | boolean | No | Yes | Wheelchair accessible at this stop | `true` |
| `stop_cancelled` | boolean | No | Yes | This stop cancelled | `true` |
| `track_scheduled` | string | **Yes** | Yes | Scheduled track (null = unknown) | `"A"` |
| `track` | string | **Yes** | Yes | Realtime track (null = unknown) | `"A"` |
| `delay_time` | integer | **Yes** | Yes | Arrival delay in seconds | `60` |
| `departure_delay` | integer | **Yes** | Yes | Departure delay in seconds | `60` |
| `alerts` | alert[] | No | Yes | Alerts for stop or trip | — |

---

### stopsItem

A station returned by `GET /stops`.

**Required**: all 5 properties

| Property | Type | Description | Example |
|---|---|---|---|
| `stop_name` | string | Station name | `"Grimma, Bahnhof (Bus)"` |
| `stop_id` | string | Stop ID (used in routing and autocomplete) | `"0013039"` |
| `lat` | latitude | Latitude (-90 to 90) | `51.230301` |
| `lon` | longitude | Longitude (-180 to 180) | `12.715422` |
| `priority` | integer | Relative priority (importance + traffic) | `4528` |

---

### coordinate

A geographic coordinate point. Used in `stopTimesResponse.beforeShape`/`afterShape`.

**Required**: `lon`, `lat`

| Property | Type | Description |
|---|---|---|
| `lon` | longitude | Longitude (-180 to 180) |
| `lat` | latitude | Latitude (-90 to 90) |

---

### alert

Service alert / disruption. Used in `monitorItem.alerts[]` and `stopTimesItem.alerts[]`.

**Required**: all 6 properties

| Property | Type | Description | Example |
|---|---|---|---|
| `alertUrl` | string | URL for more info | — |
| `effectiveStartDate` | epoch | Alert start (ms since Unix epoch) | `1670340300000` |
| `effectiveEndDate` | epoch | Alert end (ms since Unix epoch) | `1670423100000` |
| `alertHeaderText` | string | Alert headline | — |
| `alertDescriptionText` | string | Alert details | — |
| `alertCategory` | integer | Category code (see below) | — |

**Alert categories**:

| Value | German | English |
|---|---|---|
| 0 | Stoerung | Disruption |
| 1 | Verspaetung | Delay |
| 2 | Winter | Winter conditions |
| 3 | Information | General info |
| 4 | Baustelle | Construction |
| 5 | Veranstaltung | Event |
| 6 | Anschluss wird nicht erreicht | Connection not reached |

---

## Schemas — Array Wrappers

| Schema | Type | Items | Used By |
|---|---|---|---|
| `monitorInfo` | array | `monitorItem` | GET/POST `/monitor` response |
| `directionInfo` | array | `directionItem` | POST `/directionInfo/{stopId}` response |
| `stopsInfo` | array | `stopsItem` | GET `/stops` response |

---

## Schemas — Primitive Types

| Schema | Type | Pattern / Constraints | Example | Description |
|---|---|---|---|---|
| `timeString` | string | `^(?:(?:([01]?\d\|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$` | `"17:23:12"` | `HH:MM:SS` time |
| `dateString` | string | `\d{4}(0[1-9]\|1[012])(0[1-9]\|[12][0-9]\|3[01])` | `"20221201"` | `YYYYMMDD` date |
| `dateTimeString` | string | *(no pattern)* | `"2022-12-01 17:23:12"` | Date-time in Europe/Berlin timezone |
| `epoch` | integer | min: 0, max: 2147483647000 | `1670340300000` | Unix epoch (milliseconds) |
| `tinyInt` | integer | enum: `[0, 1]` | — | Binary integer (**orphan — not referenced anywhere**) |
| `latitude` | number | min: -90, max: 90 | `51.230301` | WGS84 latitude |
| `longitude` | number | min: -180, max: 180 | `12.715422` | WGS84 longitude |

---

## Schema Relationship Diagram

```
GET  /monitor ──────┐
POST /monitor ──────┼──> monitorInfo ──> monitorItem[]
                    │                        ├── arrival_time ──> timeString
                    │                        ├── date ──────────> dateString
                    │                        ├── departure_time -> timeString
                    │                        ├── departure_date -> dateString
                    │                        └── alerts[] ─────> alert
                    │                                              ├── effectiveStartDate -> epoch
                    │                                              └── effectiveEndDate ──> epoch
                    │
POST /directionInfo ┼──> directionInfo ──> directionItem[]
     /{stopId}      │                        (no $refs)
     body: directionInfoRequestItem (single or array)
                    │
GET  /stops ────────┼──> stopsInfo ──> stopsItem[]
                    │                    ├── lat ──> latitude
                    │                    └── lon ──> longitude
                    │
POST /stopTimes ────┼──> stopTimesResponse
     body: inline   │      ├── tripInfo (standalone, no $refs)
     uses:          │      ├── beforeGivenStop[] ──> stopTimesItem
       dateTimeString      ├── atGivenStop ────────> stopTimesItem
       dateString   │      ├── afterGivenStop[] ───> stopTimesItem
                    │      │                           ├── arrival_time -> timeString
                    │      │                           ├── date ────────> dateString
                    │      │                           ├── departure_time -> timeString
                    │      │                           ├── departure_date -> dateString
                    │      │                           └── alerts[] ────> alert -> epoch
                    │      ├── beforeShape[] ──> coordinate
                    │      └── afterShape[] ───> coordinate
                    │                              ├── lat -> latitude
                    │                              └── lon -> longitude

ORPHAN: tinyInt (not referenced)
```

---

## Schema Cross-Reference

| Schema | Referenced By |
|---|---|
| `timeString` | `monitorItem.arrival_time/departure_time`, `stopTimesItem.arrival_time/departure_time` |
| `dateString` | `monitorItem.date/departure_date`, `stopTimesItem.date/departure_date`, `/stopTimes` request body (`serviceDate`) |
| `dateTimeString` | `/stopTimes` request body (`arrivalTime`, `departureTime`) |
| `epoch` | `alert.effectiveStartDate/effectiveEndDate` |
| `tinyInt` | **Nothing** (orphan) |
| `latitude` | `coordinate.lat`, `stopsItem.lat` |
| `longitude` | `coordinate.lon`, `stopsItem.lon` |
| `alert` | `monitorItem.alerts[]`, `stopTimesItem.alerts[]` |
| `monitorItem` | `monitorInfo[]` |
| `monitorInfo` | GET/POST `/monitor` response |
| `directionItem` | `directionInfo[]` |
| `directionInfo` | POST `/directionInfo/{stopId}` response |
| `directionInfoRequestItem` | POST `/directionInfo/{stopId}` request body |
| `tripInfo` | `stopTimesResponse.tripInfo` |
| `stopTimesItem` | `stopTimesResponse.beforeGivenStop[]`, `.atGivenStop`, `.afterGivenStop[]` |
| `stopTimesResponse` | POST `/stopTimes` response |
| `coordinate` | `stopTimesResponse.beforeShape[]`, `.afterShape[]` |
| `stopsItem` | `stopsInfo[]` |
| `stopsInfo` | GET `/stops` response |

---

## Notable Quirks & Inconsistencies

1. **Phantom required fields**: `monitorItem` requires `stop_accessible` but doesn't define it as a property (it exists on `stopTimesItem`). `stopTimesItem` requires `waiting_time` and `dep_waiting_time` but doesn't define them (they exist on `monitorItem`). Likely copy-paste errors.

2. **`tinyInt` is an orphan**: Defined as `integer` with `enum: [0, 1]` but never referenced anywhere in the spec.

3. **Content-type trailing colon**: Every response content-type is `"application/json:"` instead of `"application/json"` — spec-wide typo.

4. **`dateString` pattern double-escaped**: The pattern contains `\\d` (literal backslash+d) instead of `\d` (digit). `timeString` does not have this issue.

5. **`dateTimeString` has no pattern**: Unlike `timeString` and `dateString`, `dateTimeString` has no regex constraint — format is only implied by the example.

6. **`bb` parameter schema missing**: `GET /stops` params `bb` and `order_by` have no `schema` definition. Also, `bb` is marked `required: false` in the parameter but `required: ["bb"]` at operation level (non-standard OpenAPI).

7. **Mixed naming conventions**: ~47 properties use `snake_case` (`arrival_time`, `stop_id`), ~23 use `camelCase` (`agencyName`, `directionId`). Even within `monitorItem`: `trip_headsign` (snake) next to `directionId` (camel).

8. **Type mismatch for shared field names**: `line`, `agencyName`, `directionId` are `string[]` (arrays) in `directionInfoRequestItem` but plain `string` in `directionItem`, `monitorItem`, and `tripInfo`. Intentional (filter vs value) but potentially confusing.

9. **`stop_lat`/`stop_lon` lack constraints**: `stopsItem` uses `$ref: latitude/longitude` (getting min/max). `stopTimesItem` uses inline `type: number` with no constraints for the same data.

10. **`POST /monitor` body is inline**: Defines filter body inline instead of reusing `directionInfoRequestItem`, despite identical fields (`line`, `agencyName`, `directionId`, `transportTypes`).

11. **Delay units**: `delay_time` and `departure_delay` are in **seconds** on both `monitorItem` and `stopTimesItem`. `waiting_time` and `dep_waiting_time` are in **minutes** (only on `monitorItem`).

12. **`monitorItem` description says "return array"**: Describes the parent `monitorInfo` rather than the item itself.

13. **Required + nullable fields**: 6 fields on `monitorItem`, 2 on `tripInfo`, and 4 on `stopTimesItem` are both required and nullable — the key must be present but the value can be `null`.
