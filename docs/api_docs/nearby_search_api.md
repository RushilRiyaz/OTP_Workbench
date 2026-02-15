# Near-By Search API Documentation

> Generated from `near_by_search_api_docs.json` (OpenAPI spec v20251205)

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [GET /search](#1-get-search)
  - [GET /getProviderInformation/{id}](#2-get-getproviderinformationid)
  - [GET /getVehicles/{id}](#3-get-getvehiclesid)
  - [GET /getVehiclesForStations/{ids}](#4-get-getvehiclesforstationsids)
  - [GET /getVehicleAvailabilities/{id} (DEPRECATED)](#5-get-getvehicleavailabilitiesid-deprecated)
  - [GET /nearByFlinkster (DEPRECATED)](#6-get-nearbyflinkster-deprecated)
  - [GET /listFlinksterVehicleProperties (DEPRECATED)](#7-get-listflinkstervehicleproperties-deprecated)
- [Response Format Routing](#response-format-routing)
- [Schemas — Primitive Types](#schemas--primitive-types)
- [Schemas — JSON Format](#schemas--json-format)
  - [searchItemJson](#searchitemjson)
  - [bikeFreeSearchJson](#bikefreesearchjson)
  - [bikeStationSearchJson](#bikestationsearchjson)
  - [flinksterSearchJson](#flinkster searchjson)
  - [flinksterVehicleJson](#flinkstervehiclejson)
  - [escooterFreeSearchJson](#escooterfreesearchjson)
  - [escooterStationSearchJson](#escooterstationsearchjson)
  - [taxi](#taxi)
  - [mobistation](#mobistation)
  - [stop](#stop)
  - [ticketSeller](#ticketseller)
  - [parkit](#parkit)
  - [flexa](#flexa)
  - [multipleStationGetVehiclesJson](#multiplestationgetvehiclesjson)
- [Schemas — TRIAS Format](#schemas--trias-format)
  - [baseTrias](#baseTrias)
  - [baseTrias12](#baseTrias12)
  - [locationTrias](#locationtrias)
  - [locationTrias12](#locationtrias12)
  - [searchTriasExtension](#searchTriasExtension)
  - [triasCategory](#triascategory)
  - [trias12Category](#trias12category)
  - [getVehiclesNextbikeTriasExtension](#getvehiclesnextbiketriasextension)
  - [getVehicleFlinksterTriasExtension](#getvehicleflinkster triasextension)
  - [getVehicleEscooterTriasExtension](#getvehicleescootertriasextension)
  - [bikeSearchTrias](#bikesearchtrias)
  - [flinksterSearchTrias](#flinkster searchtrias)
  - [flinksterVehicleTrias](#flinkstervehicletrias)
  - [bikeListItemTrias](#bikelistitemtrias)
- [Schema Relationship Diagram](#schema-relationship-diagram)
- [Schema Cross-Reference](#schema-cross-reference)
- [Notable Quirks & Observations](#notable-quirks--observations)

---

## Overview

| Field | Value |
|---|---|
| **Title** | Near-by-search |
| **Version** | v20251205 |
| **Base URL** | `https://api.lmservices.mobilityinnovate.net/api/nearBySearch` |
| **Protocol** | HTTPS, REST (GET) |
| **Response Format** | `application/json` |
| **Endpoints** | 7 (4 active, 3 deprecated) |
| **Schemas** | 30 |

The API searches for nearby stations, stops, car/bike rentals, e-scooters, mobistations, parking areas, ticket sellers, flexa stops, and taxis within a bounding box or radius. Free-floating vehicle positions update every 30 seconds.

---

## Authentication

| Header | Value |
|---|---|
| `X-API-Key` | Required on all endpoints. Rate-limited API key. |

Example: `bGltaXRlZD0=7TZVONXl3fj1qa8dk55hPDLijl2s42sBTG0LwnQ7`

---

## Endpoints

### 1. GET /search

```
GET /search
```

Full URL: `https://api.lmservices.mobilityinnovate.net/api/nearBySearch/search`

**Summary**: The search includes fixed point of interest, and free floating vehicles updated all 30s.

**Description**: Searches stations/stops/car-/bike-rentals/mobistations within a given bounding box or center and radius.

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `center` | query | string | **Yes** | — | Center coordinate in `lat,lon` format (e.g. `51.35,12.35`) |
| 3 | `radius` | query | number | **Yes** | — | Radius in meters from center |
| 4 | `format` | query | string | No | — | `TRIAS`, `TRIAS12`, or anything else for default JSON |
| 5 | `types` | query | string | No | all | Comma-separated: `station`, `stop`, `free_floating`, `parkingarea`, `operationarea`, `mobistation` |
| 6 | `vehicletypes` | query | string | No | all | Comma-separated: `car`, `bike` |
| 7 | `sources` | query | string | No | all | Comma-separated: `nextbike`, `cantamen`, `flinkster`, `taxi`, `lvb`, `gtfs-mdv`, `escooter`, `ticket-seller`, `parkit`, `flexa` |
| 8 | `provider` | query | string | No | — | Comma-separated provider names (e.g. `nextbike Leipzig`, `LTB Leipzig`, `teilAuto`, `escooter`, `S O NAH`) |
| 9 | `number` | query | integer | No | all | Max number of results |

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `oneOf[ searchItemJson[], baseTrias, baseTrias12 ]` |

---

### 2. GET /getProviderInformation/{id}

```
GET /getProviderInformation/{id}
```

**Description**: Gives information about the provider of a place (`id` = `prov_id`).

#### Parameters

| # | Name | Location | Type | Required | Description |
|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | Rate-limited API key |
| 2 | `id` | path | string | **Yes** | Provider ID (`prov_id` from search results) |

#### Response 200

No response schema defined.

---

### 3. GET /getVehicles/{id}

```
GET /getVehicles/{id}
```

**Summary**: Returns all vehicles by ID.

**Description**: Returns all vehicles available between `start` and `end` at the given station. Optional time parameters use ISO format: `yyyy-MM-ddTHH:mm:ssPHH:mm` where `P` = `+` or `-` and the second `HH:mm` is the timezone offset. Default: returns all possible vehicles that could be rented at the station (from database).

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `id` | path | string | **Yes** | — | Station ID |
| 3 | `start` | query | string | No | — | Start time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 4 | `end` | query | string | No | — | End time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 5 | `key_general_val` | query | string | No | — | Comma-separated key-value filter pairs (`key,value,key,value,...`). Use `\|\|` for OR in values. |
| 6 | `format` | query | string | No | — | `TRIAS`, `TRIAS12`, or empty for provider JSON |

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `oneOf[ bikeFreeSearchJson[], flinksterVehicleJson[], baseTrias, baseTrias12 ]` |

---

### 4. GET /getVehiclesForStations/{ids}

```
GET /getVehiclesForStations/{ids}
```

**Summary**: Returns all vehicles by station_id.

**Description**: Same as `/getVehicles`, but for multiple stations. JSON response structure differs slightly.

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `ids` | path | string | **Yes** | — | Comma-separated station IDs |
| 3 | `start` | query | string | No | — | Start time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 4 | `end` | query | string | No | — | End time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 5 | `key_general_val` | query | string | No | — | Key-value filter pairs |
| 6 | `format` | query | string | No | — | `TRIAS`, `TRIAS12`, or empty for provider JSON |

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `oneOf[ multipleStationGetVehiclesJson[], baseTrias, baseTrias12 ]` |

---

### 5. GET /getVehicleAvailabilities/{id} (DEPRECATED)

```
GET /getVehicleAvailabilities/{id}
```

**Summary**: Returns availabilities of the vehicle.

**Description**: Get a list of time-intervals where the given vehicle is available. Currently only Flinkster support.

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `id` | path | string | **Yes** | — | Vehicle ID (format: `source-uid`, e.g. `flinkster-94D54B24...`) |
| 3 | `start` | query | string | No | today 00:00:00 | Start time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 4 | `end` | query | string | No | today + 8 days | End time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |

#### Response 200

Array of availability intervals (inline schema, no `$ref`):

| Property | Type | Format | Description | Example |
|---|---|---|---|---|
| `begin` | string | date-time | Start of availability (ISO 8601) | `"2024-09-12T22:00:00Z"` |
| `end` | string | date-time | End of availability (ISO 8601) | `"2024-09-20T22:00:00Z"` |

---

### 6. GET /nearByFlinkster (DEPRECATED)

```
GET /nearByFlinkster
```

**Summary**: Returns available vehicles with stations.

**Description**: Get a list of Flinkster stations and vehicles in a radius around the center that are available in the given timespan and fulfill filter criteria.

#### Parameters

| # | Name | Location | Type | Required | Default | Description |
|---|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | — | Rate-limited API key |
| 2 | `center` | query | string | **Yes** | — | `lat,lon` coordinate |
| 3 | `radius` | query | int | No | 500 | Search radius in meters (max 100000) |
| 4 | `start` | query | string | No | — | Start time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 5 | `end` | query | string | No | — | End time (`yyyy-MM-ddTHH:mm:ssPHH:mm`) |
| 6 | `key_general_val` | query | string | No | — | Key-value filter pairs |
| 7 | `format` | query | string | No | — | `TRIAS`, `TRIAS12`, or empty for provider JSON |

#### Response 200

| Content-Type | Schema |
|---|---|
| `application/json` | `oneOf[ multipleStationGetVehiclesJson[], baseTrias, baseTrias12 ]` |

---

### 7. GET /listFlinksterVehicleProperties (DEPRECATED)

```
GET /listFlinksterVehicleProperties
```

**Summary**: Returns list of possible values for a Flinkster property.

**Description**: Example: `{key:{prop1:"p1",prop2:"p2"}}`. Asking for `key` gives `["p1","p2"]`. Asking for `key.prop1` gives `["p1"]`.

#### Parameters

| # | Name | Location | Type | Required | Description |
|---|---|---|---|---|---|
| 1 | `X-API-Key` | header | string | **Yes** | Rate-limited API key |
| 2 | `property` | query | string | **Yes** | Property/key in Flinkster response (e.g. `fuel.value`) |

#### Response 200

`array` of `string` — all values under the given property.

---

## Response Format Routing

The `format` query parameter controls the response shape across endpoints:

| `format` value | Response wrapper | Items schema |
|---|---|---|
| *(empty/JSON)* | Raw JSON array | `searchItemJson[]`, `bikeFreeSearchJson[]`, `flinksterVehicleJson[]`, `multipleStationGetVehiclesJson[]` |
| `TRIAS` | `baseTrias` (version `"1.1"`) | `locationTrias` items with appropriate extension |
| `TRIAS12` | `baseTrias12` (version `"1.2"`) | `locationTrias12` items with appropriate extension |

---

## Schemas — Primitive Types

| Type | JSON Type | Min | Max | Example |
|---|---|---|---|---|
| `latitude` | number | -90 | 90 | `51.230301` |
| `longitude` | number | -180 | 180 | `12.715422` |

---

## Schemas — JSON Format

### searchItemJson

Object found in `/search` for `format`=`JSON`.

**Required**: `id`, `name`, `lat`, `lon`, `type`, `source`, `provider`, `data`, `prov_id`, `mobistation_id`

| Property | Type | Description | Example |
|---|---|---|---|
| `id` | string | Object ID | `"nextbike-144737862"` |
| `name` | string | Display name | `"BIKE 23252"` |
| `lat` | latitude | Latitude | — |
| `lon` | longitude | Longitude | — |
| `type` | string | Object type: `station`, `stop`, `free_floating`, `parkingarea`, `operationarea`, `mobistation`, `konsum` | `"free_floating"` |
| `source` | string | Data source: `gtfs_mdv`, `nextbike`, `taxi`, `ticket-seller`, `escooter`, `lvb`, `flexa` | `"nextbike"` |
| `provider` | string | Service provider: `nextbike Leipzig`, `MDV`, `Taxi 4884`, `escooter`, `lvb` | `"nextbike Leipzig"` |
| `data` | object | Booking/rental data (type varies by source) | — |
| `prov_id` | string | Provider ID | `"nextbike-nextbike Leipzig"` |
| `mobistation_id` | string | Mobistation ID (`"null"` if none) | `"null"` |

**`data` oneOf variants** (determined by `source` and `type`):

| Source | Type | Schema |
|---|---|---|
| nextbike | free_floating | `bikeFreeSearchJson` |
| nextbike | station | `bikeStationSearchJson` |
| flinkster | station/parkingarea/operationarea | `flinksterSearchJson` |
| taxi | — | `taxi` |
| lvb | mobistation | `mobistation` |
| gtfs-mdv | stop | `stop` |
| escooter | free_floating | `escooterFreeSearchJson` |
| escooter | station | `escooterStationSearchJson` |
| ticket-seller | — | `ticketSeller` |
| flexa | — | `flexa` |

---

### bikeFreeSearchJson

Free-floating bike or individual bike within a station (source=nextbike, type=free_floating).

**Required**: all 10 properties

| Property | Type | Nullable | Description | Example | Enum |
|---|---|---|---|---|---|
| `uid` | integer | **Yes** | Unique ID. `null` if bike is in a station. | `476156396` | — |
| `state` | string | No | Current state | — | `["ok"]` |
| `active` | boolean | No | Whether active | `true` | — |
| `number` | string | No | Bike number | `"23337"` | — |
| `bike_type` | integer | No | Bike type code | `71` | — |
| `lock_types` | string[] | No | Lock types | `["frame_lock"]` | — |
| `vehicletype` | string | No | Vehicle type | — | `["bike"]` |
| `bikeTypeName` | string | No | Bike type name | `"mit Rahmenschloss"` | — |
| `boardcomputer` | integer | No | Onboard computer ID | `7551143414` | — |
| `electric_lock` | boolean | No | Has electric lock | `true` | — |

---

### bikeStationSearchJson

Bike station data (source=nextbike, type=station).

**Required**: all 8 properties

| Property | Type | Description | Example | Enum |
|---|---|---|---|---|
| `uid` | integer | Station ID | `363445521` | — |
| `number` | string | Station number | `"4139"` | — |
| `num_spaces` | integer | Total spaces | `0` | — |
| `vehicletype` | string | Vehicle type | — | `["bike"]` |
| `num_vehicles` | integer | Number of vehicles | `2` | — |
| `terminal_type` | string | Terminal type | `"free"` | — |
| `num_free_spaces` | integer | Free spaces | `0` | — |
| `num_available_vehicles` | integer | Available vehicles | `2` | — |

---

### flinksterSearchJson

Flinkster (car-sharing) station data.

**Required**: `address`, `attributes`, `vehicletype`, `providerAreaId`

| Property | Type | Description | Example | Enum |
|---|---|---|---|---|
| `address.zip` | string | Postal code | `"04109"` | — |
| `address.city` | string | City | `"Leipzig"` | — |
| `address.number` | string | House number | `"7"` | — |
| `address.street` | string | Street | `"Willy-Brandt-Platz"` | — |
| `attributes.parking.description` | string | Parking description | `"10 Stellplatze..."` | — |
| `attributes.locationnote.description` | string | Location instructions | `"Sie kommen mit dem Zug..."` | — |
| `vehicletype` | string | Vehicle type | — | `["car"]` |
| `providerAreaId` | string | Provider area ID | `"409668"` | — |

---

### flinksterVehicleJson

Individual Flinkster vehicle data (from `/getVehicles`).

**Required**: `rentalObject`

**`rentalObject` required**: `name`, `type`, `model`, `category`, `providerRentalObjectId`, `attributes`, `equipment`, `access`, `prices`, `uid`

Also has a top-level `available` boolean.

| Property | Type | Description | Example |
|---|---|---|---|
| `rentalObject.name` | string | Vehicle name | `"Ford Fiesta 5 turig"` |
| `rentalObject.type` | string | Rental type | `"vehicle"` |
| `rentalObject.model` | string | Model type | `"stationbased"` |
| `rentalObject.category.uid` | string | Category UID | `"122002"` |
| `rentalObject.category.name` | string | Category name | `"Klein"` |
| `rentalObject.providerRentalObjectId` | string | Provider object ID | `"220132"` |
| `rentalObject.uid` | string | Unique ID (UUID) | `"0920a911-..."` |
| `available` | boolean | Currently available | `true` |

**Attributes** (`rentalObject.attributes`):

| Property | Sub-props | Example |
|---|---|---|
| `licenseplate` | `value` | `"HAL-JM 265"` |
| `transmissionType` | `value`, `description` | `"manual"` / `"Manuell"` |
| `colour` | `description` | `"Agate Black"` |
| `seats` | `value`, `description` | `5` / `"5"` |
| `doors` | `value`, `description` | `5` / `"5"` |
| `fillLevel` | `value`, `description` | `75` / `"75"` |
| `fuel` | `value`, `description` | `"petrol"` / `"Benzin"` |

**Equipment** (`rentalObject.equipment`):

| Property | Description |
|---|---|
| `navigationSystem` | `"Navigationssystem"` |
| `cruiseControl` | `"Tempomat"` |
| `parkDistanceControl` | `"Einparkhilfe"` |
| `tyreType` | `"Winterreifen"` |
| `isofixSeatFittings` | `"Kindersitzhalterung (ISOFIX)"` |
| `bluetoothHandsFreeCalling` | `"Bluetooth-Freisprechanlage"` |
| `carPlay` | `"Android Auto / Apple CarPlay"` |
| `airConditioning` | `"Klimaanlage"` |
| `emissionsStickers` | `"Umweltplakette grun"` |

**Access** (`rentalObject.access`):

| Property | Items |
|---|---|
| `start.accessMedia[]` | `{ customerPinRequired: boolean, type: string }` |
| `stop.accessMedia[]` | `{ customerPinRequired: boolean, type: string }` |

**Prices** (`rentalObject.prices`):

| Property | Type | Nullable | Example |
|---|---|---|---|
| `price_6_to_22` | string | No | `"3,29 EUR/h"` |
| `price_22_to_6` | string | No | `"1,00 EUR/h"` |
| `price_24h` | string | No | `"35,00 EUR/24h"` |
| `price_per_km` | string | No | `"0,29 EUR/km"` |
| `info` | string | No | `"Die erste Stunde wird voll berechnet..."` |
| `estimatedPrice` | string | **Yes** | `null` |

---

### escooterFreeSearchJson

Free-floating e-scooter data.

**Required**: `uid`, `code`, `price`, `zone_id`, `provider`, `vehicletype`, `battery_level`

| Property | Type | Description | Example | Enum |
|---|---|---|---|---|
| `uid` | string | Vehicle ID | `"e168cddb-..."` | — |
| `code` | string | Unlock code | `"373666"` | — |
| `price.price_id` | string | Price model ID (TIER only) | `"85a46030-..."` | — |
| `price.start_price` | string | Start price (EUR) | `"1.00"` | — |
| `price.price_per_min` | string | Per-minute price (EUR) | `"0.22"` | — |
| `zone_id` | string | Zone | `"LEIPZIG"` | — |
| `provider` | string | Provider | `"tier"` | `["tier", "voi"]` |
| `iotVendor` | string | IoT vendor (TIER only, optional) | `"ninebot_g3"` | — |
| `vehicletype` | string | Vehicle type | — | `["escooter"]` |
| `licencePlate` | string | License plate (TIER only, optional) | `"247IIC"` | — |
| `battery_level` | integer | Battery % | `86` | — |

---

### escooterStationSearchJson

E-scooter station data.

**Required**: `provider`, `num_spaces`, `vehicletype`, `num_vehicles`, `num_free_spaces`

| Property | Type | Description | Example | Enum |
|---|---|---|---|---|
| `provider` | string[] | Providers at station | `["voi", "tier"]` | `["voi", "tier"]` |
| `num_spaces` | integer | Total parking spaces | `6` | — |
| `vehicletype` | string | Vehicle type | — | `["escooter"]` |
| `num_vehicles` | integer | Scooters parked | `3` | — |
| `num_free_spaces` | integer | Free spaces | `3` | — |
| `num_available_vehicles` | integer | Available scooters (optional) | `3` | — |

---

### taxi

Taxi data (source=taxi).

**Required**: `phone`

| Property | Type | Description | Example |
|---|---|---|---|
| `phone` | string | Taxi company phone number | `"0341 4884"` |

---

### mobistation

Multi-modal mobility hub (source=lvb).

**Required**: all 15 properties

| Property | Type | Nullable | Description | Example |
|---|---|---|---|---|
| `address.city` | string | No | City | `"Leipzig"` |
| `address.street` | string | No | Street | `"Wintergartenstrasse"` |
| `address.postalcode` | string | No | Postal code | `"04315"` |
| `stop_id` | string | **Yes** | Public transport stop ID | `"gtfs-mdv-0012705"` |
| `bike_racks` | integer | **Yes** | Bike racks | — |
| `parking_spaces` | integer | **Yes** | Parking spaces | — |
| `charging_points` | integer | No | EV charging points | `0` |
| `taxi_station_id` | string | **Yes** | Taxi station ID | — |
| `car_sharing_places` | integer | No | Car-sharing spots | `0` |
| `escooter_station_id` | string | **Yes** | E-scooter station ID | `"escooter-109"` |
| `nextbike_station_id` | string | **Yes** | Nextbike station ID | — |
| `teilauto_station_id` | string | **Yes** | Teilauto station ID | — |
| `e_car_sharing_places` | integer | **Yes** | Electric car-sharing spots | — |
| `disabled_parking_spaces` | integer | **Yes** | Disabled parking | — |
| `escooter_station_information` | object | **Yes** | E-scooter station details (untyped) | — |
| `nextbike_station_information` | object | **Yes** | Nextbike station details (untyped) | — |
| `teilauto_station_information` | object | **Yes** | Teilauto station details (untyped) | — |

---

### stop

Public transport stop (source=gtfs-mdv).

**Required**: `address`, `zone_id`, `wheelchair_boarding`, `stop_id`

| Property | Type | Nullable | Description | Example | Enum |
|---|---|---|---|---|---|
| `address.city` | string | No | City | `"Leipzig"` | — |
| `address.state` | string | No | State | `"Sachsen"` | — |
| `address.county` | string | No | County | `"Leipzig"` | — |
| `address.district` | string | No | District | `"Zentrum-Ost"` | — |
| `address.postalcode` | string | No | Postal code | `"04103"` | — |
| `stop_id` | string | No | Stop ID (routing API input) | `"0013000"` | — |
| `zone_id` | string | No | Tariff zone | `"110"` | — |
| `wheelchair_boarding` | integer | **Yes** | GTFS wheelchair value | — | `[0, 1, 2]` |

---

### ticketSeller

Ticket selling location (source=ticket-seller).

**Required**: `city`, `type`, `notes`, `street`, `postcode`, `housenumber`, `addressExact`

| Property | Type | Nullable | Description | Example | Enum |
|---|---|---|---|---|---|
| `city` | string | No | City | `"Leipzig"` | — |
| `type` | string | No | Seller type | `"ticket-machine"` | `["ticket-machine", "lvb-services", "shop", "konsum", "service-point"]` |
| `notes` | object | **Yes** | Only set for ticket-machine | — | — |
| `notes.machineNumber` | integer | No | Machine number | `1151` | — |
| `street` | string | No | Street | `"Paul-List-Strasse"` | — |
| `postcode` | string | No | Postal code | `"04103"` | — |
| `housenumber` | string | No | House number | `"5"` | — |
| `addressExact` | boolean | No | Whether address is exact | — | — |

---

### parkit

Parking area data (source=parkit).

**Required**: `address`, `num_spaces`, `num_free_spaces`, `num_disabled_spaces`, `num_electric_spaces`, `num_vehicles`, `occupation_level`, `vehicletype`

| Property | Type | Nullable | Description | Example | Enum |
|---|---|---|---|---|---|
| `address.city` | string | No | City | `"Leipzig"` | — |
| `address.state` | string | No | State | `"Sachsen"` | — |
| `address.county` | string | No | County | `"Leipzig"` | — |
| `address.nation` | string | No | Country | `"Deutschland"` | — |
| `address.street` | string | No | Street | `"Friedhofsweg"` | — |
| `address.suburb` | string | No | Suburb | `"Probstheida"` | — |
| `address.postcode` | string | No | Postal code | `"04299"` | — |
| `address.housenumber` | string | No | House number | `"3"` | — |
| `num_spaces` | integer | No | Total spaces | `300` | — |
| `num_free_spaces` | integer | **Yes** | Free spaces (null if unknown) | `205` | — |
| `num_disabled_spaces` | integer | No | Disabled spaces | — | — |
| `num_electric_spaces` | integer | No | EV spaces | — | — |
| `num_vehicles` | integer | **Yes** | Vehicles parked (null if unknown) | `96` | — |
| `occupation_level` | string | **Yes** | Occupation level (null if unknown) | `"FREE"` | `["FREE", "MEDIUM", "FULL"]` |
| `vehicletype` | string | No | Vehicle type | — | `["car"]` |
| `num_available_vehicles` | integer | **Yes** | Vehicles for rent (optional, null if unknown) | `0` | — |

---

### flexa

On-demand transport stop (source=flexa).

**Required**: `address`, `flexaId`, `flexaName`, `suspendedTo`, `suspendedFrom`, `transferToPublicTransport`

| Property | Type | Nullable | Format | Description | Example |
|---|---|---|---|---|---|
| `address.city` | string | No | — | City | `"Leipzig"` |
| `address.state` | string | No | — | State | `"Sachsen"` |
| `address.county` | string | No | — | County | `"Leipzig"` |
| `address.district` | string | No | — | District | `"Zentrum-Ost"` |
| `address.postalcode` | string | No | — | Postal code | `"04103"` |
| `flexaId` | integer | No | — | Flexa stop ID | `511` |
| `flexaName` | string | No | — | Flexa stop name | `"SC 2"` |
| `suspendedTo` | string | **Yes** | date-time | Suspension end | `"2023-08-25T00:00:00Z"` |
| `suspendedFrom` | string | **Yes** | date-time | Suspension start | `"2023-08-25T00:00:00Z"` |
| `transferToPublicTransport` | integer | **Yes** | — | FlexaId for PT transfer | `4` |

---

### multipleStationGetVehiclesJson

Response for multi-station vehicle search (from `/getVehiclesForStations` and `/nearByFlinkster`).

**Required**: `station_id`, `vehicles`

| Property | Type | Description |
|---|---|---|
| `station_id` | string | Station ID (same as request) |
| `vehicles` | array | `oneOf` per item: `flinksterVehicleJson`, `bikeFreeSearchJson`, `escooterFreeSearchJson` |

---

## Schemas — TRIAS Format

### baseTrias

Wrapper for TRIAS v1.1 responses.

**Required**: `serviceDelivery`, `version`

```
baseTrias
├── version: "1.1"
└── serviceDelivery
    └── deliveryPayload
        └── locationInformationResponse
            ├── errorMessage[]: string[] (always empty)
            └── location[]: locationTrias[]
```

---

### baseTrias12

Wrapper for TRIAS v1.2 responses.

**Required**: `serviceDelivery`, `version`

```
baseTrias12
├── version: "1.2"
└── serviceDelivery
    └── deliveryPayload
        └── locationInformationResponse
            ├── errorMessage[]: string[] (always empty)
            └── locationResult[]: locationTrias12[]
```

**Key difference**: uses `locationResult` (not `location`) and references `locationTrias12` (not `locationTrias`).

---

### locationTrias

**Required**: `location`, `complete`, `probability`, `mode`

| Property | Type | Description |
|---|---|---|
| `location.pointOfInterest.pointOfInterestCode` | string | ID with schema `source-uid` |
| `location.pointOfInterest.pointOfInterestName.text` | string | Name |
| `location.pointOfInterest.pointOfInterestCategory` | string[] | Not used, always empty |
| `location.pointOfInterest.privateCode` | string[] | Not used, always empty |
| `location.geoPosition.longitude` | number | Longitude |
| `location.geoPosition.latitude` | number | Latitude |
| `location.attribute` | string[] | Not used, always empty |
| `location.extension` | oneOf | See extension variants below |
| `complete` | boolean | Not used |
| `probability` | number | Match probability |
| `mode` | string[] | Not used, always empty |

---

### locationTrias12

**Required**: `location`, `complete`, `mode` (no `probability`)

Key differences from `locationTrias`:
- `probability` is **not** required
- `pointOfInterestName` is an **array** (minItems: 1, maxItems: 1) of `{text: string}`, not a single object
- Has additional `nameSuffix` on pointOfInterest (always empty)
- Has `locationName` on location (always empty)
- `geoPosition` fields have `format: float`

---

### Extension variants

Both `locationTrias` and `locationTrias12` use `oneOf` for `location.extension`:

| Extension Schema | Used By Endpoint | Description |
|---|---|---|
| `searchTriasExtension` | `/search` only | Search results |
| `getVehiclesNextbikeTriasExtension` | `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` | Nextbike vehicles |
| `getVehicleFlinksterTriasExtension` | `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` | Flinkster vehicles |
| `getVehicleEscooterTriasExtension` | `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` | E-scooter vehicles |

---

### searchTriasExtension

**Required**: `category`, `custom`

| Property | Type | oneOf |
|---|---|---|
| `category` | array | `triasCategory` or `trias12Category` |
| `custom` | object | `bikeSearchTrias`, `flinksterSearchTrias`, `taxi`, `mobistation`, `stop`, `escooterFreeSearchJson`, `escooterStationSearchJson`, `ticketSeller`, `parkit`, `flexa` |

---

### triasCategory

3-element string array. `minItems: 3`, `maxItems: 3`.

| Index | Value | Description |
|---|---|---|
| `[0]` | `"custom"` | Always `"custom"` |
| `[1]` | enum value | Source: `nextbike`, `flinkster`, `taxi`, `escooter`, `ticket-seller`, `parkit`, `flexa` |
| `[2]` | `"lvb_umkreissuche"` | Always this value |

---

### trias12Category

3-element string array. `minItems: 3`, `maxItems: 3`.

Same structure as `triasCategory` except:
- Adds `"dbconnect"` to enum
- For Flinkster sources, `[1]` uses `"dbconnect"` instead of `"flinkster"`

---

### getVehiclesNextbikeTriasExtension

**Required**: `category`, `custom`, `bikeList`

| Property | Type | Description |
|---|---|---|
| `category` | oneOf triasCategory/trias12Category | Category |
| `custom.available_bikes` | integer | Available bikes |
| `custom.total_bikes` | integer | Total bikes (same as available_bikes) |
| `custom.free_racks` | integer | Free racks |
| `custom.bike_racks` | integer | Total bike racks |
| `custom.station_type` | string | enum: `["PHYSICAL_STATION"]` |
| `custom.sku` | string | enum: `["NEXTBIKE"]` |
| `custom.external_reference` | integer | External ref ID (not set in TRIAS12) |
| `bikeList[]` | bikeListItemTrias[] | Bikes at station |

---

### getVehicleFlinksterTriasExtension

**Required**: `category`, `custom`, `cantamenCarList`

| Property | Type | Description |
|---|---|---|
| `category` | oneOf triasCategory/trias12Category | Category |
| `custom.provider.name` | string | Provider name (e.g. `"JETZT mobil"`) |
| `custom.provider.id` | string | Provider ID (e.g. `"jez_mobil"`) |
| `custom.external_reference` | string | UUID |
| `custom.type` | string | `"station"` |
| `custom.providerAreaId` | string | Provider area ID |
| `cantamenCarList[]` | flinksterVehicleTrias[] | Cars at station |

---

### getVehicleEscooterTriasExtension

**Required**: `category`, `custom`, `escooterList`

| Property | Type | Description |
|---|---|---|
| `category` | oneOf triasCategory/trias12Category | Category |
| `custom` | escooterStationSearchJson | Station data |
| `escooterList[]` | escooterFreeSearchJson[] | Individual scooters |

> **Spec quirk**: `escooterList` is declared at schema root level outside `properties`.

---

### bikeSearchTrias

Bike search data in TRIAS format (when `category[1]`=`nextbike`).

**Required**: `external_reference`, `available_bikes`, `total_bikes`, `station_type`, `sku`, `data`

| Property | Type | Description | Enum |
|---|---|---|---|
| `external_reference` | string | Same as `pointOfInterestCode` for TRIAS. In TRIAS12, only set for `FLOATING_BIKE`. | — |
| `available_bikes` | integer | Available bikes | — |
| `total_bikes` | integer | Total bikes | — |
| `station_type` | string | Station type | `["FLOATING_BIKE", "PHYSICAL_STATION"]` |
| `sku` | string | SKU | `["NEXTBIKE"]` |
| `data` | oneOf | Bike data | `bikeFreeSearchJson` or `bikeStationSearchJson` |

---

### flinksterSearchTrias

Flinkster search data in TRIAS format (when `category[1]`=`flinkster`/`dbconnect`).

**Required**: `provider`, `external_reference`, `type`, `data`

| Property | Type | Description | Enum |
|---|---|---|---|
| `provider.id` | string | Provider ID | — |
| `provider.name` | string | Provider name | — |
| `external_reference` | string | ID without `flinkster-` prefix | — |
| `type` | string | Location type | `["station", "parkingarea", "operationarea"]` |
| `data` | flinksterSearchJson | Flinkster data | — |

---

### flinksterVehicleTrias

Flinkster vehicle in TRIAS format.

**Required**: `id`, `name`, `sku`, `type`, `model`, `categoryId`, `categoryName`, `accessStart`, `accessStop`, `attributes`, `equipment`, `available`, `prices`

| Property | Type | Description | Example |
|---|---|---|---|
| `id` | string | Combined provider + vehicle ID | `"0920a911-..._PROVIDERID_220132"` |
| `name` | string | Vehicle name | `"Ford Fiesta 5 turig"` |
| `sku` | string | SKU | `"DBCAR"` |
| `type` | string | Type | `"vehicle"` |
| `model` | string | Model type | `"stationbased"` |
| `categoryId` | string | Category UID | `"122002"` |
| `categoryName` | string | Category name | `"Klein"` |
| `accessStart[]` | array | Access methods for start | `{type: "app", customerPinRequired: true}` |
| `accessStop[]` | array | Access methods for stop | `{type: "app", customerPinRequired: true}` |
| `attributes` | object | Same as `flinksterVehicleJson` attributes (with `required` on sub-props) | — |
| `equipment` | object | Same + 2 extra: `audioInline`, `passengerAirbagTurnOff` | — |
| `available` | boolean | Available for rental | `true` |
| `prices` | object | Same as `flinksterVehicleJson` prices | — |

**Differences from `flinksterVehicleJson`**:
- Flat structure (no `rentalObject` wrapper)
- Category fields are flat (`categoryId`/`categoryName` vs nested `category.uid`/`category.name`)
- Access fields are flat (`accessStart`/`accessStop` vs nested `access.start.accessMedia`/`access.stop.accessMedia`)
- Attribute sub-properties have explicit `required` declarations
- Equipment sub-properties have `required: ["description"]`
- 2 extra equipment fields: `audioInline`, `passengerAirbagTurnOff`

---

### bikeListItemTrias

Individual bike within a TRIAS getVehicles response.

**Required**: all 10 properties

| Property | Type | Description | Example |
|---|---|---|---|
| `number` | integer | Bike number | `20489` |
| `language` | string | Language | `"de"` |
| `gpsTracking` | boolean | GPS enabled | `false` |
| `bikeType` | integer | Bike type code | `71` |
| `lockTypes` | string[] | Lock types | `["frame_lock"]` |
| `active` | boolean | Currently active | `true` |
| `placeId` | integer | Location ID | `16337` |
| `cityId` | string | City ID | `"1"` |
| `domain` | string | Operation area | `"le"` |
| `bikeTypeName` | string | Bike type name | `"mit Rahmenschloss"` |

---

## Schema Relationship Diagram

```
/search (format=JSON)
└── searchItemJson[]
    ├── lat ─$ref─> latitude
    ├── lon ─$ref─> longitude
    └── data ─oneOf─┬─> bikeFreeSearchJson
                    ├─> bikeStationSearchJson
                    ├─> flinksterSearchJson
                    ├─> taxi
                    ├─> mobistation
                    ├─> stop
                    ├─> escooterFreeSearchJson
                    ├─> escooterStationSearchJson
                    ├─> ticketSeller
                    └─> flexa

/search (format=TRIAS)           /search (format=TRIAS12)
└── baseTrias                    └── baseTrias12
    └── ...location[]                └── ...locationResult[]
        └── locationTrias                └── locationTrias12
            └── extension ─oneOf─┐           └── extension ─oneOf─┐
                                 ▼                                 ▼
                    ┌────────────────────────────────┐
                    │ searchTriasExtension            │  (/search only)
                    │ ├── category ─oneOf─> triasCategory / trias12Category
                    │ └── custom ─oneOf─┬─> bikeSearchTrias
                    │                   │    └── data ─oneOf─> bikeFreeSearchJson / bikeStationSearchJson
                    │                   ├─> flinksterSearchTrias
                    │                   │    └── data ─$ref─> flinksterSearchJson
                    │                   ├─> taxi
                    │                   ├─> mobistation
                    │                   ├─> stop
                    │                   ├─> escooterFreeSearchJson
                    │                   ├─> escooterStationSearchJson
                    │                   ├─> ticketSeller
                    │                   ├─> parkit
                    │                   └─> flexa
                    ├────────────────────────────────┐
                    │ getVehiclesNextbikeTriasExt     │  (/getVehicles etc.)
                    │ ├── category ─oneOf─> triasCategory / trias12Category
                    │ └── bikeList[] ─$ref─> bikeListItemTrias
                    ├────────────────────────────────┐
                    │ getVehicleFlinksterTriasExt     │
                    │ ├── category ─oneOf─> triasCategory / trias12Category
                    │ └── cantamenCarList[] ─$ref─> flinksterVehicleTrias
                    ├────────────────────────────────┐
                    │ getVehicleEscooterTriasExt      │
                    │ ├── category ─oneOf─> triasCategory / trias12Category
                    │ ├── custom ─$ref─> escooterStationSearchJson
                    │ └── escooterList[] ─$ref─> escooterFreeSearchJson
                    └────────────────────────────────┘

/getVehicles/{id} (format=JSON)
├── bikeFreeSearchJson[]      (nextbike)
└── flinksterVehicleJson[]    (flinkster)

/getVehiclesForStations/{ids} (format=JSON)    /nearByFlinkster (format=JSON)
└── multipleStationGetVehiclesJson[]           └── multipleStationGetVehiclesJson[]
    └── vehicles[] ─oneOf─┬─> flinksterVehicleJson
                          ├─> bikeFreeSearchJson
                          └─> escooterFreeSearchJson

/getVehicleAvailabilities/{id}  →  [{begin, end}]  (inline)
/getProviderInformation/{id}    →  (no schema)
/listFlinksterVehicleProperties →  string[]
```

---

## Schema Cross-Reference

| Schema | Used By Schemas | Used By Endpoints |
|---|---|---|
| `latitude` | `searchItemJson.lat` | `/search` |
| `longitude` | `searchItemJson.lon` | `/search` |
| `searchItemJson` | (top-level) | `/search` (JSON) |
| `baseTrias` | (top-level) | `/search`, `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` (TRIAS) |
| `baseTrias12` | (top-level) | Same as baseTrias (TRIAS12) |
| `locationTrias` | `baseTrias` | Via baseTrias |
| `locationTrias12` | `baseTrias12` | Via baseTrias12 |
| `searchTriasExtension` | `locationTrias/12.extension` | `/search` (TRIAS) |
| `triasCategory` | All 4 TRIAS extensions | All TRIAS endpoints |
| `trias12Category` | All 4 TRIAS extensions | All TRIAS12 endpoints |
| `getVehiclesNextbikeTriasExtension` | `locationTrias/12.extension` | `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` |
| `getVehicleFlinksterTriasExtension` | `locationTrias/12.extension` | Same |
| `getVehicleEscooterTriasExtension` | `locationTrias/12.extension` | Same |
| `bikeFreeSearchJson` | `searchItemJson.data`, `bikeSearchTrias.data`, `multipleStationGetVehiclesJson.vehicles` | `/search`, `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` |
| `bikeStationSearchJson` | `searchItemJson.data`, `bikeSearchTrias.data` | `/search` |
| `bikeSearchTrias` | `searchTriasExtension.custom` | `/search` (TRIAS) |
| `flinksterSearchJson` | `searchItemJson.data`, `flinksterSearchTrias.data` | `/search` |
| `flinksterSearchTrias` | `searchTriasExtension.custom` | `/search` (TRIAS) |
| `flinksterVehicleJson` | `multipleStationGetVehiclesJson.vehicles` | `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` (JSON) |
| `flinksterVehicleTrias` | `getVehicleFlinksterTriasExtension.cantamenCarList` | `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` (TRIAS) |
| `bikeListItemTrias` | `getVehiclesNextbikeTriasExtension.bikeList` | Same (TRIAS) |
| `taxi` | `searchItemJson.data`, `searchTriasExtension.custom` | `/search` |
| `mobistation` | `searchItemJson.data`, `searchTriasExtension.custom` | `/search` |
| `stop` | `searchItemJson.data`, `searchTriasExtension.custom` | `/search` |
| `escooterFreeSearchJson` | `searchItemJson.data`, `searchTriasExtension.custom`, `getVehicleEscooterTriasExtension.escooterList`, `multipleStationGetVehiclesJson.vehicles` | `/search`, `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` |
| `escooterStationSearchJson` | `searchItemJson.data`, `searchTriasExtension.custom`, `getVehicleEscooterTriasExtension.custom` | `/search`, `/getVehicles`, `/getVehiclesForStations`, `/nearByFlinkster` |
| `ticketSeller` | `searchItemJson.data`, `searchTriasExtension.custom` | `/search` |
| `parkit` | `searchTriasExtension.custom` **only** | `/search` (TRIAS/TRIAS12 only) |
| `flexa` | `searchItemJson.data`, `searchTriasExtension.custom` | `/search` |
| `multipleStationGetVehiclesJson` | (top-level) | `/getVehiclesForStations`, `/nearByFlinkster` (JSON) |

---

## Notable Quirks & Observations

1. **`parkit` missing from JSON format**: `parkit` appears only in `searchTriasExtension.custom` and is absent from `searchItemJson.data` oneOf. Parking data is only available in TRIAS/TRIAS12 responses.

2. **`escooterList` outside `properties`**: In `getVehicleEscooterTriasExtension`, the `escooterList` field is declared at schema root level instead of inside `properties` — likely a spec authoring error.

3. **`triasCategory` description/enum mismatch**: Description says third element is `lvb_getvehicles`, but the enum only contains `lvb_umkreissuche`.

4. **`dbconnect` vs `flinkster`**: In `trias12Category`, Flinkster sources use `"dbconnect"` as `category[1]` instead of `"flinkster"` (which `triasCategory` uses).

5. **3 deprecated endpoints**: `getVehicleAvailabilities`, `nearByFlinkster`, and `listFlinksterVehicleProperties` are all deprecated.

6. **`getProviderInformation` has no response schema**: The endpoint returns 200 OK but defines no response body structure.

7. **`flinksterVehicleJson` vs `flinksterVehicleTrias` structural mismatch**: JSON format wraps everything in `rentalObject` with nested objects. TRIAS format is flat. TRIAS also adds 2 extra equipment fields (`audioInline`, `passengerAirbagTurnOff`).

8. **`locationTrias` vs `locationTrias12` differences**: TRIAS12 drops `probability` from required, changes `pointOfInterestName` from object to array, adds `nameSuffix` and `locationName`, and adds `format: float` on geoPosition.

9. **Time format**: ISO with timezone offset: `yyyy-MM-ddTHH:mm:ssPHH:mm` where `P` = `+` or `-`. Used by `start`/`end` params on vehicle endpoints.

10. **`mobistation_id` string "null"**: In `searchItemJson`, `mobistation_id` uses the string `"null"` (not JSON null) when no mobistation is associated.

11. **Mixed address schemas**: Different source schemas use different address structures — `stop` has 5 fields (city, state, county, district, postalcode), `parkit` has 8 fields (adds nation, suburb, housenumber, street), `mobistation` has 3 fields (city, street, postalcode). No shared address schema.

12. **`key_general_val` filter**: The key-value filter uses a flat comma-separated format (`key,value,key,value,...`) with `||` for OR — an unusual convention that could be fragile with values containing commas.
