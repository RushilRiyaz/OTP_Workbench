# OTP Routing API Documentation

> Generated from `routing_modul_otp_api_docs.json` (OpenAPI spec v20260206)

## Table of Contents

- [Overview](#overview)
- [Endpoint](#endpoint)
- [Authentication](#authentication)
- [Request Parameters](#request-parameters)
  - [Parameters Summary](#parameters-summary)
  - [Travel Modes](#travel-modes)
- [Response Structure](#response-structure)
  - [Top-Level: OtpResponse](#top-level-otpresponse)
  - [requestParameters (echo)](#requestparameters-echo)
  - [itinerary](#itinerary)
  - [Legs (nonTransitLeg vs transitLeg)](#legs-nontransitleg-vs-transitleg)
  - [nonTransitLeg](#nontransitleg)
  - [transitLeg](#transitleg)
  - [station](#station)
  - [fromToLocation](#fromtolocation)
  - [legGeometry](#leggeometry)
  - [step](#step)
  - [alert](#alert)
  - [zoneInfo](#zoneinfo)
  - [flexaProperties](#flexaproperties)
  - [timeWindow](#timewindow)
  - [E-Scooter Schemas](#e-scooter-schemas)
  - [Bike & Car Rental Schemas](#bike--car-rental-schemas)
- [Primitive Type Aliases](#primitive-type-aliases)
- [Schema Relationship Diagram](#schema-relationship-diagram)
- [Schema Cross-Reference](#schema-cross-reference)
- [Notable Quirks & Inconsistencies](#notable-quirks--inconsistencies)

---

## Overview

| Field | Value |
|---|---|
| **Title** | Routing modul |
| **Version** | v20260206 |
| **Base URL** | `https://api.lmservices.mobilityinnovate.net/api/otp` |
| **Protocol** | HTTPS, REST (GET) |
| **Response Format** | `application/json` |

The API executes a routing request between a From and To point using selected transportation modes. It returns one or more itineraries, each containing an ordered list of legs (transit and non-transit).

---

## Endpoint

```
GET /otp
```

Full URL: `https://api.lmservices.mobilityinnovate.net/api/otp/otp`

---

## Authentication

| Header | Value |
|---|---|
| `X-API-Key` | Required. Rate-limited API key. |

Example: `bGltaXRlZD0=7TZVONXl3fj1qa8dk55hPDLijl2s42sBTG0LwnQ7`

---

## Request Parameters

### Detailed Parameter Reference

#### `From` (query, **required**)

Starting point. Accepts either:
- Coordinates: `lat,lon` (decimal `.` separator) — e.g. `51.33394,12.37490`
- Stop-ID: GTFS stop ID from routing data, autocomplete, or nearby-search — e.g. `0013000` (Leipzig main station Tram/Bus)

#### `To` (query, **required**)

Ending point. Same format as `From`.

Example: `51.37435,12.48922`

#### `Travelmode` (query, **required**)

Transportation type. Comma-separated list of modes.

Example: `TRANSIT` or `WALK,BUS,TRAM`

See [Travel Modes](#travel-modes) for all available values.

#### `date` (query, optional)

Departure date in format `mm-dd-yyyy` (month-day-year).

Default: current date in `Europe/Berlin` timezone.

Example: `02-06-2026`

#### `time` (query, optional)

Departure time in format `hh:mm` (with optional `am`/`pm` suffix).

Default: current time in `Europe/Berlin` timezone.

**Constraint**: requires `date` to also be set.

Example: `16:46`

#### `numItineraries` (query, optional)

Number of itineraries to return.

Default: `1`

Example: `3`

#### `arriveBy` (query, optional)

If `"true"`, the given date/time refer to arrival time instead of departure.

Default: `"false"`

#### `accessibility` (query, optional, **DEPRECATED**)

If `1`, only wheelchair-accessible routes are returned.

Default: `false`. Format: `0` or `1`.

#### `shortWalk` (query, optional)

If `1`, the algorithm prefers shorter walking distances.

Default: `false`. Format: `0` or `1`.

#### `lessTransfers` (query, optional)

If `1`, the algorithm prefers fewer transfers.

Default: `false`. Format: `0` or `1`.

#### `maxWalkDistance` (query, optional, **DEPRECATED**)

Maximum walking distance to a station in meters.

Default: `5000`

#### `mockup` (query, optional)

If `true`, the API generates predefined mockup alerts.

Default: `false`. Type: boolean.

---

### Parameters Summary

| # | Name | Location | Required | Type | Default | Deprecated | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | Yes | string | — | No | Auth key |
| 2 | `From` | query | Yes | string | — | No | `lat,lon` or Stop-ID |
| 3 | `To` | query | Yes | string | — | No | `lat,lon` or Stop-ID |
| 4 | `Travelmode` | query | Yes | string | — | No | Comma-separated modes |
| 5 | `date` | query | No | string | current date (Europe/Berlin) | No | `mm-dd-yyyy` |
| 6 | `time` | query | No | string | current time (Europe/Berlin) | No | `hh:mm[am\|pm]`; requires `date` |
| 7 | `numItineraries` | query | No | string | `1` | No | Number of routes |
| 8 | `arriveBy` | query | No | string | `false` | No | `"true"` / `"false"` |
| 9 | `accessibility` | query | No | string | `false` | **Yes** | `0` or `1`; wheelchair |
| 10 | `shortWalk` | query | No | string | `false` | No | `0` or `1` |
| 11 | `lessTransfers` | query | No | string | `false` | No | `0` or `1` |
| 12 | `maxWalkDistance` | query | No | string | `5000` | **Yes** | Meters |
| 13 | `mockup` | query | No | boolean | `false` | No | Mockup alerts |

---

### Travel Modes

20 supported travel modes, passed as comma-separated values in the `Travelmode` parameter:

| Mode | Description |
|---|---|
| `TRANSIT` | Equivalent to `WALK,TRAM,BUS,SUBURB,TRAIN` |
| `WALK` | Walking |
| `BIKE` | Bicycle |
| `BIKERENTAL` | Bike rental (nextbike) |
| `CAR` | Car |
| `CARRENTAL` | Car rental (Teilauto) |
| `BUS` | Bus |
| `TRAM` | Tram (Strassenbahn) |
| `SUBURB` | Suburban railway (S-Bahn) |
| `TRAIN` | Regional and long-distance train |
| `SUBWAY` | Underground (U-Bahn) |
| `RE` | Regional express (Regional-Bahn) |
| `ICE` | Inter-city express |
| `IC` | Inter-city rail |
| `COACH` | Long-distance bus |
| `TAXI4884` | CAR routing only within TAXI4884 service area |
| `ESCOOTER` | E-scooter (max 15 min walking legs) |
| `FLEXA` | On-demand bus (Flexa) in Leipzig |
| `RRB` | Rail replacement bus (SEV / Schienenersatzverkehr) |
| `OD` | On-demand bus (Rufbus) |

---

## Response Structure

### Top-Level: OtpResponse

**Required fields**: `RetStatus`, `requestParameters`, `plan`

| Property | Type | Required | Description |
|---|---|---|---|
| `RetStatus` | object | Yes | Status envelope |
| `RetStatus.Value` | string | Yes | `"OK"` or `"FEHLER"` (error) |
| `RetStatus.Comments` | string | No | Error details (present on failure) |
| `requestParameters` | requestParameters | Yes | Echo of request parameters (see below) |
| `plan` | object | Yes | The routing plan |
| `plan.date` | epoch | No | Plan date as Unix epoch ms |
| `plan.from` | object | Yes | Origin: `{ name, lat, lon }` |
| `plan.to` | object | Yes | Destination: `{ name, lat, lon }` |
| `plan.itineraries` | itinerary[] | Yes | Array of routing results |

---

### requestParameters (echo)

The response echoes back the request parameters. **Required**: `From`, `To`, `Travelmode`.

| Property | Type | Default | Description |
|---|---|---|---|
| `From` | string | — | Origin as sent |
| `To` | string | — | Destination as sent |
| `Travelmode` | string | — | Travel mode(s) |
| `date` | string | current date `MM-DD-YYYY` | Trip date |
| `time` | string | current time `hh:mm` | Trip time |
| `numItineraries` | number | `1` | Number of itineraries |
| `arriveBy` | boolean | `false` | Whether time = arrival |
| `accessibility` | boolean | `false` | Wheelchair routing |
| `shortWalk` | boolean | `false` | Prefer short walks |
| `lessTransfers` | boolean | `false` | Prefer fewer transfers |
| `transitOnly` | boolean | `false` | Transit only (no walk to/from stops) |
| `mockup` | boolean | `false` | Generate mockup alerts |

> **Note**: `transitOnly` appears only in the response echo, not as a query parameter.

---

### itinerary

A single routing result with one or more legs.

**Required**: `duration`, `startTime`, `endTime`, `legs`, `walkTime`, `transitTime`, `waitingTime`, `walkDistance`, `transfers`, `zoneInfo`

| Property | Type | Required | Description |
|---|---|---|---|
| `duration` | integer | Yes | Total trip duration (seconds) |
| `startTime` | epoch | Yes | Departure time (ms) |
| `endTime` | epoch | Yes | Arrival time (ms) |
| `walkTime` | integer | Yes | Total walking time (seconds) |
| `transitTime` | integer | Yes | Total transit time (seconds) |
| `waitingTime` | integer | Yes | Total waiting time (seconds) |
| `walkDistance` | integer | Yes | Total walking distance |
| `transfers` | integer | Yes | Number of transfers |
| `legs` | leg[] | Yes | Ordered array of legs (`anyOf` nonTransitLeg / transitLeg) |
| `zoneInfo` | zoneInfo | Yes | Tariff zone information (nullable) |
| `otpVersion` | string | No | OTP engine version |
| `startTimeHHMM` | timeString | No | Departure as `HH:MM` |
| `endTimeHHMM` | timeString | No | Arrival as `HH:MM` |
| `durationHHMM` | timeString | No | Duration as `HH:MM` |

---

### Legs (nonTransitLeg vs transitLeg)

Legs are discriminated by the `mode` property:

- **Non-transit modes** → `nonTransitLeg`: `WALK`, `BIKE`, `BIKERENTAL`, `CAR`, `CARRENTAL`, `TAXI4884`, `BIKE AND TRANSIT`, `BIKERENTAL-TRANSIT`
- **Transit modes** → `transitLeg`: `BUS`, `TRAM`, `SUBURB`, `TRAIN`, `FLEXA`, `SUBWAY`, `FERRY`, `GONDOLA`

Key differences:
- `nonTransitLeg.from/to` can be `station` OR `fromToLocation` (arbitrary coords)
- `transitLeg.from/to` are always `station`
- Transit legs have GTFS metadata: `route`, `agencyName`, `headsign`, `tripId`, etc.
- Non-transit legs have rental info: `escooterInfo`, `rentedEscooter`
- Transit legs have: `intermediateStops`, `wheelchairAccessible`, `cancelled`, `flexaProperties`

---

### nonTransitLeg

**Required**: `startTime`, `endTime`, `departureDelay`, `arrivalDelay`, `realTime`, `distance`, `mode`, `from`, `to`, `legGeometry`, `duration`, `departureDelayedTime`, `arrivalDelayedTime`, `transitLeg`, `rentedBike`, `alerts`

| Property | Type | Required | Description |
|---|---|---|---|
| `startTime` | epoch | Yes | Leg departure time |
| `endTime` | epoch | Yes | Leg arrival time |
| `departureDelay` | integer | Yes | Departure delay |
| `arrivalDelay` | integer | Yes | Arrival delay |
| `realTime` | boolean | Yes | Whether realtime data available |
| `distance` | integer | Yes | Leg distance |
| `mode` | string | Yes | `WALK`, `BIKE`, `BIKERENTAL`, `CAR`, `CARRENTAL`, `TAXI4884`, `BIKE AND TRANSIT`, `BIKERENTAL-TRANSIT` |
| `from` | station \| fromToLocation | Yes | Origin (`oneOf`) |
| `to` | station \| fromToLocation | Yes | Destination (`oneOf`) |
| `legGeometry` | legGeometry | Yes | Polyline geometry |
| `rentedBike` | boolean | Yes | Whether leg uses a rented bike or car |
| `duration` | integer | Yes | Duration (seconds) |
| `transitLeg` | boolean | Yes | Always `false` |
| `departureDelayedTime` | epoch | Yes | Departure adjusted for delay |
| `arrivalDelayedTime` | epoch | Yes | Arrival adjusted for delay |
| `alerts` | alert[] | Yes | Alerts for this leg |
| `steps` | step[] | No | Turn-by-turn navigation |
| `departureDelayedTimeHHMM` | timeString | No | Delayed departure `HH:MM` |
| `arrivalDelayedTimeHHMM` | timeString | No | Delayed arrival `HH:MM` |
| `startTimeHHMM` | timeString | No | Scheduled departure `HH:MM` |
| `endTimeHHMM` | timeString | No | Scheduled arrival `HH:MM` |
| `escooterInfo` | escooterInfo | No | E-scooter details (when `rentedEscooter=true`) |
| `rentedEscooter` | boolean | No | `true` if e-scooter found |

---

### transitLeg

**Required**: `startTime`, `endTime`, `departureDelay`, `arrivalDelay`, `realTime`, `distance`, `mode`, `from`, `to`, `legGeometry`, `duration`, `departureDelayedTime`, `arrivalDelayedTime`, `transitLeg`, `route`, `agencyName`, `wheelchairAccessible`, `routeColor`, `routeType`, `routeId`, `headsign`, `agencyId`, `tripId`, `serviceDate`, `routeShortName`, `routeLongName`, `rentedBike`, `intermediateStops`, `alerts`, `wheelchairBoardingVehicle`, `cancelled`

| Property | Type | Required | Description |
|---|---|---|---|
| `startTime` | epoch | Yes | Leg departure time |
| `endTime` | epoch | Yes | Leg arrival time |
| `departureDelay` | integer | Yes | Departure delay |
| `arrivalDelay` | integer | Yes | Arrival delay |
| `realTime` | boolean | Yes | Realtime data available |
| `distance` | integer | Yes | Leg distance |
| `mode` | string | Yes | `BUS`, `TRAM`, `SUBURB`, `TRAIN`, `FLEXA`, `SUBWAY`, `FERRY`, `GONDOLA` |
| `route` | string | Yes | Route identifier |
| `agencyName` | string | Yes | Transit agency name |
| `agencyUrl` | string (uri) | No | Transit agency URL |
| `wheelchairAccessible` | integer | Yes | `0`=no info, `1`=accessible, `2`=not accessible |
| `routeColor` | string | Yes | Route display color |
| `routeType` | integer | Yes | GTFS route type |
| `routeId` | string | Yes | GTFS route ID |
| `headsign` | string | Yes | Trip direction indicator |
| `agencyId` | string | Yes | Transit agency ID |
| `tripId` | string | Yes | GTFS trip ID |
| `serviceDate` | string | Yes | Format `YYYYMMDD` |
| `routeShortName` | string | Yes | Short name (e.g. "11") |
| `routeLongName` | string | Yes | Long name |
| `from` | station | Yes | Departure station |
| `to` | station | Yes | Arrival station |
| `legGeometry` | legGeometry | Yes | Polyline geometry |
| `rentedBike` | boolean | Yes | Whether rented bike used |
| `duration` | integer | Yes | Duration (seconds) |
| `transitLeg` | boolean | Yes | Always `true` |
| `intermediateStops` | station[] | Yes | Intermediate stops |
| `cancelled` | boolean | Yes | `true` if leg cancelled |
| `wheelchairBoardingVehicle` | wheelchairBoarding | Yes | Vehicle accessibility (`0`, `1`, `2`) |
| `departureDelayedTime` | epoch | Yes | Departure adjusted for delay |
| `arrivalDelayedTime` | epoch | Yes | Arrival adjusted for delay |
| `alerts` | alert[] | Yes | Alerts for this leg |
| `steps` | step[] | No | Navigation steps (rare for transit) |
| `departureDelayedTimeHHMM` | timeString | No | Delayed departure `HH:MM` |
| `arrivalDelayedTimeHHMM` | timeString | No | Delayed arrival `HH:MM` |
| `startTimeHHMM` | timeString | No | Scheduled departure `HH:MM` |
| `endTimeHHMM` | timeString | No | Scheduled arrival `HH:MM` |
| `flexaProperties` | flexaProperties | No | Flexa-specific (only when `mode=FLEXA`) |

---

### station

A GTFS transit station/stop.

**Required**: `name`, `lon`, `lat`, `stopId`, `zoneId`, `wheelchairBoarding`, `track`, `scheduledTrack`, `cancelled`

| Property | Type | Required | Nullable | Description |
|---|---|---|---|---|
| `name` | string | Yes | No | GTFS station name |
| `stopId` | string | Yes | No | GTFS stop ID |
| `lon` | longitude | Yes | No | Station longitude |
| `lat` | latitude | Yes | No | Station latitude |
| `zoneId` | string | Yes | No | Tariff zone |
| `wheelchairBoarding` | wheelchairBoarding | Yes | No | `0`=no info, `1`=accessible, `2`=not |
| `track` | string | Yes | No | Realtime track (`null` if unknown) |
| `scheduledTrack` | string | Yes | Yes | Scheduled track (`null` if unknown) |
| `cancelled` | boolean | Yes | No | `true` if trip can't stop here |
| `arrival` | epoch | No | No | Arrival time |
| `departure` | epoch | No | No | Departure time |
| `departureDelayedTime` | epoch | No | No | Departure adjusted for delay |
| `arrivalDelayedTime` | epoch | No | No | Arrival adjusted for delay |
| `departureDelayedTimeHHMM` | timeString | No | No | Delayed departure `HH:MM` |
| `arrivalDelayedTimeHHMM` | timeString | No | No | Delayed arrival `HH:MM` |
| `arrivalDelay` | integer | No | No | Delay in **minutes** |
| `departureDelay` | integer | No | No | Delay in **minutes** |
| `boardAlightType` | string | No | No | Always `"DEFAULT"` |
| `hafas_id` | string | No | No | Child stop ID (if exists) |
| `hafas_name` | string | No | No | Child stop name (if exists) |
| `alerts` | alert[] | No | No | Alerts for this station |

---

### fromToLocation

An arbitrary (non-station) location with optional rental info.

**Required**: `name`, `lon`, `lat`

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Location name |
| `lon` | longitude | Yes | Longitude |
| `lat` | latitude | Yes | Latitude |
| `arrival` | epoch | No | Arrival time |
| `departure` | epoch | No | Departure time |
| `departureDelayedTime` | epoch | No | Departure adjusted for delay |
| `arrivalDelayedTime` | epoch | No | Arrival adjusted for delay |
| `departureDelayedTimeHHMM` | timeString | No | Delayed departure `HH:MM` |
| `arrivalDelayedTimeHHMM` | timeString | No | Delayed arrival `HH:MM` |
| `arrivalDelay` | integer | No | Delay in **seconds** |
| `departureDelay` | integer | No | Delay in **seconds** |
| `bikeShareId` | string | No | Rented bike/car ID (only if rental found) |
| `bikeInfo` | bikeInfo | No | Bike rental info (only in `from` if found) |
| `carStationInfo` | carStationInfo | No | Car rental info (only in `from` if found) |

---

### legGeometry

Polyline geometry as an array of coordinate points.

**Required**: `points`

| Property | Type | Required | Description |
|---|---|---|---|
| `points` | array | Yes | Array of `{ lat: latitude, lon: longitude }` objects |

---

### step

Turn-by-turn navigation instruction within a leg.

**Required**: `distance`, `relativeDirection`, `streetName`, `absoluteDirection`, `lon`, `lat`

| Property | Type | Required | Description |
|---|---|---|---|
| `distance` | integer | Yes | Distance for this step |
| `relativeDirection` | string | Yes | Relative direction (e.g. `"LEFT"`, `"RIGHT"`, `"CONTINUE"`) |
| `streetName` | string | Yes | Street name |
| `absoluteDirection` | string | Yes | Compass direction (e.g. `"NORTH"`, `"SOUTHEAST"`) |
| `lon` | longitude | Yes | Step start longitude |
| `lat` | latitude | Yes | Step start latitude |

---

### alert

Service alert / disruption notification.

**Required**: `effectiveStartDate`, `effectiveEndDate`, `alertHeaderText`, `alertDescriptionText`, `alertCategory`

| Property | Type | Required | Nullable | Description |
|---|---|---|---|---|
| `alertUrl` | string | No | Yes | URL with more information |
| `effectiveStartDate` | epoch | Yes | No | Alert start time |
| `effectiveEndDate` | epoch | Yes | No | Alert end time |
| `alertHeaderText` | string | Yes | Yes | Alert headline |
| `alertDescriptionText` | string | Yes | No | Alert detailed description |
| `alertCategory` | integer | Yes | No | Category code (see below) |

**Alert categories**:

| Value | German | English |
|---|---|---|
| `0` | Stoerung | Disruption |
| `1` | Verspaetung | Delay |
| `2` | Winter | Winter conditions |
| `3` | Information | General info |
| `4` | Baustelle | Construction |
| `5` | Veranstaltung | Event |
| `6` | Anschluss wird nicht erreicht | Connection not reachable |

---

### zoneInfo

Tariff zone information. The entire object is **nullable**.

**Required**: `zones`, `orderedZones`, `shortDistanceTicket`

| Property | Type | Required | Description |
|---|---|---|---|
| `zones` | string[] | Yes | All tariff zones in itinerary (unordered) |
| `orderedZones` | string[] | Yes | Zones in traversal order |
| `shortDistanceTicket` | boolean | Yes | Whether a short-distance ticket applies |

---

### flexaProperties

On-demand bus (Flexa) specific properties. Only present when `mode=FLEXA`.

**Required**: `legId`, `cancelled`, `ecobusUserRequestId`, `vehicleId`, `vehicleName`, `ecoVehicleId`, `originStopId`, `destinationStopId`, `promisedDepartureTimeWindow`, `promisedArrivalTimeWindow`, `actualDepartureDate`, `actualArrivalDate`, `notifications`

| Property | Type | Required | Nullable | Description |
|---|---|---|---|---|
| `legId` | string | Yes | Yes | Flexa leg ID |
| `cancelled` | boolean | Yes | Yes | Whether Flexa leg is cancelled |
| `ecobusUserRequestId` | string | Yes | Yes | Ecobus user request ID |
| `vehicleId` | string | Yes | Yes | Vehicle ID |
| `vehicleName` | string | Yes | Yes | Vehicle name |
| `ecoVehicleId` | string | Yes | Yes | Eco vehicle ID |
| `originStopId` | string | Yes | Yes | Origin stop ID |
| `destinationStopId` | string | Yes | Yes | Destination stop ID |
| `promisedDepartureTimeWindow` | timeWindow | Yes | No | Promised departure window |
| `promisedArrivalTimeWindow` | timeWindow | Yes | No | Promised arrival window |
| `actualDepartureDate` | string | Yes | Yes | Actual departure date |
| `actualArrivalDate` | string | Yes | Yes | Actual arrival date |
| `notifications` | string[] | Yes | No | Notification messages |

---

### timeWindow

A time range with lower and upper bounds.

**Required**: `lowerBound`, `upperBound`

| Property | Type | Required | Format | Description |
|---|---|---|---|---|
| `lowerBound` | string | Yes | `date-time` (ISO 8601) | Window start: `YYYY-MM-DDTHH:mm:ss.SSSZ` |
| `upperBound` | string | Yes | `date-time` (ISO 8601) | Window end: `YYYY-MM-DDTHH:mm:ss.SSSZ` |

---

### E-Scooter Schemas

#### escooterInfo

Present when `rentedEscooter=true` on a nonTransitLeg. `null` if no station found.

| Property | Type | Required | Description |
|---|---|---|---|
| `from` | escooterStation | Yes | Starting e-scooter station |
| `to` | escooterStation | Yes | Ending e-scooter station |
| `escooterVehicleInfo` | escooterVehicleInfo | Yes | Vehicle details |
| `possibleProvider` | string[] | Yes | Providers. Pattern: `voi` or `tier` |

#### escooterVehicleInfo

First available e-scooter at the station.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | E-scooter ID |
| `name` | string | Yes | Provider name |
| `provider` | string | Yes | `"voi"` or `"tier"` |
| `price` | escooterPrice | Yes | Pricing info |
| `code` | string | Yes | Provider's internal code |
| `batteryLevel` | percentage | Yes | Battery level (0-100) |

#### escooterPrice

| Property | Type | Required | Description |
|---|---|---|---|
| `price_id` | string | Yes | Price structure ID |
| `start_price` | string | Yes | Start price in EUR (decimal `.`) |
| `price_per_min` | string | Yes | Per-minute price in EUR (decimal `.`) |

#### escooterStation

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Station ID |
| `name` | string | Yes | Station name |
| `type` | string | Yes | `"station"` or `"freefloating"` |

---

### Bike & Car Rental Schemas

#### bikeInfo

Present in `fromToLocation.bikeInfo` when bike rental found (only in `from` element).

| Property | Type | Required | Nullable | Description |
|---|---|---|---|---|
| `bikeName` | string | Yes | No | Bike or station name |
| `bikeId` | string | Yes | No | Bike ID |
| `bikeTypeName` | string | Yes | Yes | Bike type (`null` if point is a station) |
| `type` | string | Yes | No | `"station"` or `"bike"` |

#### carStationInfo

Present in `fromToLocation.carStationInfo` when car rental found (only in `from` element).

| Property | Type | Required | Description |
|---|---|---|---|
| `carShareId` | string | Yes | Car share ID |
| `providerAreaId` | string | Yes | Provider area ID |

---

## Primitive Type Aliases

These are reused throughout the spec via `$ref`:

| Type | JSON Type | Constraints | Description |
|---|---|---|---|
| `epoch` | integer | min: 0, max: 2147483647000 | Unix epoch timestamp in milliseconds |
| `timeString` | string | pattern: `^\d{1,2}:\d{2}$` | Time as `H:MM` or `HH:MM` |
| `latitude` | number | min: -90, max: 90 | WGS84 latitude |
| `longitude` | number | min: -180, max: 180 | WGS84 longitude |
| `boolean01` | integer | enum: `0`, `1` | Boolean as integer |
| `percentage` | integer | min: 0, max: 100 | Percentage value |
| `wheelchairBoarding` | integer | enum: `0`, `1`, `2` | `0`=no info, `1`=accessible, `2`=not accessible |

---

## Schema Relationship Diagram

```
OtpResponse
├── RetStatus { Value, Comments }
├── requestParameters
└── plan
    ├── date (epoch)
    ├── from { name, lon, lat }
    ├── to   { name, lon, lat }
    └── itineraries[] ──────────────────────────>  itinerary
        ├── zoneInfo { zones[], orderedZones[], shortDistanceTicket }
        └── legs[] (discriminated by "mode")
            │
            ├── nonTransitLeg
            │   ├── from ──> oneOf [ station | fromToLocation ]
            │   │                     │              │
            │   │                     │              ├── bikeInfo
            │   │                     │              └── carStationInfo
            │   │                     └── alerts[]
            │   ├── to   ──> oneOf [ station | fromToLocation ]
            │   ├── legGeometry { points[] { lon, lat } }
            │   ├── steps[] { distance, relativeDirection, streetName, ... }
            │   ├── alerts[]
            │   └── escooterInfo
            │       ├── from/to ──> escooterStation
            │       ├── escooterVehicleInfo
            │       │   └── price ──> escooterPrice
            │       └── possibleProvider[]
            │
            └── transitLeg
                ├── from ──> station
                ├── to   ──> station
                ├── intermediateStops[] ──> station
                ├── legGeometry { points[] { lon, lat } }
                ├── steps[]
                ├── alerts[]
                └── flexaProperties
                    ├── promisedDepartureTimeWindow ──> timeWindow { lowerBound, upperBound }
                    └── promisedArrivalTimeWindow   ──> timeWindow { lowerBound, upperBound }
```

---

## Schema Cross-Reference

Where each schema is referenced:

| Schema | Referenced By |
|---|---|
| `epoch` | `plan.date`, `itinerary.startTime/endTime`, all leg `startTime/endTime/departureDelayedTime/arrivalDelayedTime`, `station.arrival/departure/...`, `fromToLocation.arrival/departure/...`, `alert.effectiveStartDate/effectiveEndDate` |
| `timeString` | `itinerary.*HHMM`, `transitLeg.*HHMM`, `nonTransitLeg.*HHMM`, `station.*HHMM`, `fromToLocation.*HHMM` |
| `latitude` | `plan.from/to.lat`, `station.lat`, `fromToLocation.lat`, `legGeometry.points[].lat`, `step.lat` |
| `longitude` | Same locations as latitude, `.lon` |
| `wheelchairBoarding` | `station.wheelchairBoarding`, `transitLeg.wheelchairBoardingVehicle` |
| `percentage` | `escooterVehicleInfo.batteryLevel` |
| `boolean01` | Defined but **not referenced** by any schema (possibly legacy) |
| `escooterInfo` | `nonTransitLeg.escooterInfo` |
| `escooterVehicleInfo` | `escooterInfo.escooterVehicleInfo` |
| `escooterPrice` | `escooterVehicleInfo.price` |
| `escooterStation` | `escooterInfo.from`, `escooterInfo.to` |
| `bikeInfo` | `fromToLocation.bikeInfo` |
| `carStationInfo` | `fromToLocation.carStationInfo` |
| `flexaProperties` | `transitLeg.flexaProperties` |
| `timeWindow` | `flexaProperties.promisedDepartureTimeWindow`, `flexaProperties.promisedArrivalTimeWindow` |

---

## Notable Quirks & Inconsistencies

1. **Delay units mismatch**: `station.arrivalDelay/departureDelay` are in **minutes**, while `fromToLocation.arrivalDelay/departureDelay` are in **seconds**.

2. **`transitOnly` ghost parameter**: Appears in the response `requestParameters` echo but is not listed as a query parameter.

3. **`boolean01` unused**: Defined in schemas but not referenced anywhere.

4. **Parameter types as strings**: Most optional parameters (`arriveBy`, `shortWalk`, etc.) are typed as `string` in the query spec but `boolean` in the response echo.

5. **`accessibility` and `maxWalkDistance` deprecated**: Both still accepted but marked deprecated.

6. **`FERRY` and `GONDOLA`**: Listed as valid `transitLeg.mode` values but not in the `Travelmode` parameter enum — they may appear in results but cannot be explicitly requested.

7. **Date format**: Uses US-style `mm-dd-yyyy` despite the API being German.
