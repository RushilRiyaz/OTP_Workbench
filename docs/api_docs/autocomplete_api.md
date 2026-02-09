# Autocomplete API Documentation

> Generated from `autocomplete_api_docs.json` (OpenAPI spec v20260127)

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoint 1: GET /status](#endpoint-1-get-status)
- [Endpoint 2: GET /search](#endpoint-2-get-search)
  - [Parameters](#parameters)
  - [Response Formats](#response-formats)
  - [Responses](#responses)
- [Response Format Comparison](#response-format-comparison)
- [Schemas](#schemas)
  - [OldFormatDto (JSON format)](#oldformatdto-json-format)
  - [TriasWrapperDto](#triaswrapperdto)
  - [ServiceDelivery](#servicedelivery)
  - [DeliveryPayload](#deliverypayload)
  - [LocationInformationResponse](#locationinformationresponse)
  - [TriasLocationElement](#triaslocationelement)
  - [Point](#point)
  - [GeoPosition](#geoposition)
  - [Extension](#extension)
  - [CustomExtension](#customextension)
  - [PoiAddressLocationName](#poiaddresslocationname)
- [Response Hierarchy Diagrams](#response-hierarchy-diagrams)
  - [JSON Format (OldFormatDto)](#json-format-oldformatdto)
  - [TRIAS Format (v1.1)](#trias-format-v11)
  - [TRIAS12 Format (v1.2)](#trias12-format-v12)
- [Schema Relationship Diagram](#schema-relationship-diagram)
- [Schema Cross-Reference](#schema-cross-reference)
- [Notable Quirks & Observations](#notable-quirks--observations)

---

## Overview

| Field | Value |
|---|---|
| **Title** | Autocomplete |
| **Version** | v20260127 |
| **Base URL** | `https://api.lmservices.mobilityinnovate.net/api/autocomplete` |
| **Protocol** | HTTPS, REST (GET) |
| **Response Format** | `application/json`, `text/plain`, `text/json` |

The API provides autocomplete/search suggestions for locations (stops, POIs, streets, addresses, virtual stops) given a search substring. Results are ranked by relevance and optional proximity to a center point.

---

## Authentication

| Header | Value |
|---|---|
| `X-API-Key` | Required on all endpoints. Rate-limited API key. |

Example: `bGltaXRlZD0=7TZVONXl3fj1qa8dk55hPDLijl2s42sBTG0LwnQ7`

---

## Endpoint 1: GET /status

```
GET /status
```

Full URL: `https://api.lmservices.mobilityinnovate.net/api/autocomplete/status`

**Tag**: `HealthCheck`

**Summary**: Checks the health of the service.

### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---|---|
| `X-API-Key` | header | string | Yes | Rate-limited API key |

### Response 200

Served in 3 content types:

| Content-Type | Schema |
|---|---|
| `text/plain` | `string` |
| `application/json` | `oneOf[ OldFormatDto[], TriasWrapperDto ]` |
| `text/json` | `string` |

---

## Endpoint 2: GET /search

```
GET /search
```

Full URL: `https://api.lmservices.mobilityinnovate.net/api/autocomplete/search`

**Tag**: `Search`

**Summary**: Searches for autocomplete suggestions for a search substring.

**Example**:
```
/search?search=angerbrucke&format=JSON&center=51.3%2C12.6&size=20&pointType=P,S,W&withAddress=false
```

### Parameters

#### `search` (query, optional)

String to search for. Can be space-separated words.

Example: `"angerbrucke"`

#### `format` (query, optional)

Response format. Determines the structure of the JSON response.

| Value | Description |
|---|---|
| `JSON` | Flat array of `OldFormatDto` objects. **Recommended.** |
| `TRIAS` | Nested TRIAS v1.1 format via `TriasWrapperDto` |
| `TRIAS12` | Nested TRIAS v1.2 format via `TriasWrapperDto` (enhanced data) |

#### `center` (query, optional)

Coordinate in format `lat,lon` that specifies the center point for distance-based ranking of results.

Example: `"51.3,12.6"`

#### `size` (query, optional)

Maximum number of entries to return.

Type: `integer` (int32). Example: `20`

#### `profile` (query, optional)

Profile name as provided by Leipziger Verkehrsbetriebe.

Example: `""`

#### `pointType` (query, optional)

Comma-separated list of point types to search.

Default: `"P,S,W,V,N"` (all types)

| Code | Meaning |
|---|---|
| `P` | Point of Interest |
| `S` | Stop |
| `W` | Way (street) |
| `V` | Virtual stop (flexa, movemix, absolut) |
| `N` | Address (only included if search string contains a number) |

Example: `"P,S,W"`

#### `withAddress` (query, optional)

If a POI lacks address info, fill it with the closest address within a 40m radius. The address may not be completely accurate (e.g. if the point is outside any building or within a large building).

Type: `boolean`

#### `withTags` (query, optional)

Whether to include OSM tags in the response.

Default: `false`. Type: `boolean`.

#### `X-API-Key` (header, **required**)

Rate-limited API key.

### Parameters Summary

| # | Name | Location | Type | Required | Default | Notes |
|---|---|---|---|---|---|---|
| 1 | `search` | query | string | No | — | Space-separated words |
| 2 | `format` | query | string | No | — | `JSON`, `TRIAS`, or `TRIAS12` |
| 3 | `center` | query | string | No | — | `lat,lon` for proximity ranking |
| 4 | `size` | query | integer (int32) | No | — | Max entries |
| 5 | `profile` | query | string | No | — | LVB profile name |
| 6 | `pointType` | query | string | No | `P,S,W,V,N` | Comma-separated type codes |
| 7 | `withAddress` | query | boolean | No | — | Fill missing address from nearby |
| 8 | `withTags` | query | boolean | No | `false` | Include OSM tags |
| 9 | `X-API-Key` | header | string | **Yes** | — | Auth key |

### Responses

#### 200 OK

JSON object containing matching records, ordered descending by relevance score.

| Content-Type | Schema |
|---|---|
| `application/json` | `oneOf[ OldFormatDto[], TriasWrapperDto ]` |

Three named examples in the spec:

| Example | Format | Description |
|---|---|---|
| `oldFormat` | JSON | Array of `OldFormatDto`. Recommended — flat, easy to understand. |
| `trias12Format` | TRIAS12 | `TriasWrapperDto` with `version: "1.2"`, uses `locationResult` array. Enhanced data. |
| `triasFormat` | TRIAS | `TriasWrapperDto` with `version: "1.1"`, uses `location` array. Slightly different format. |

#### 500 Internal Server Error

Returns internal server error. No schema defined.

---

## Response Format Comparison

| Aspect | JSON (`OldFormatDto[]`) | TRIAS (v1.1) | TRIAS12 (v1.2) |
|---|---|---|---|
| **Structure** | Flat array | Deeply nested via `TriasWrapperDto` | Deeply nested via `TriasWrapperDto` |
| **Version** | N/A | `"1.1"` | `"1.2"` |
| **Results array field** | N/A (top-level array) | `location[]` | `locationResult[]` |
| **Location typing** | `ptype` field | All typed as `pointOfInterest` | Typed as `stopPlace`, `pointOfInterest`, or `address` |
| **Metadata richness** | Full (city, district, postal, tags inline) | Minimal (most custom fields `null`) | Full (custom extension populated) |
| **Recommended?** | **Yes** | No | No |

---

## Schemas

### OldFormatDto (JSON format)

The flat, recommended response format. All properties are **nullable** and **optional**.

`additionalProperties: false`

| Property | Type | Format | Description |
|---|---|---|---|
| `ExtraOrder` | integer | int32 | Ordering/ranking value |
| `data` | string | — | Full display string (e.g. `"Leipzig, Angerbrucke/Strassenbahnhof, Altlindenau, 04177, Leipzig"`) |
| `id` | string | — | Unique identifier (e.g. `"pois_g\|0011072"`) |
| `landkreis` | string | — | County/district (German: Landkreis) |
| `lat` | number | double | Latitude |
| `lon` | number | double | Longitude |
| `name` | string | — | Display name (e.g. `"Leipzig, Angerbrucke/Strassenbahnhof"`) |
| `postalcode` | string | — | Postal code |
| `ptype` | string | — | Point type: `S`=Stop, `P`=POI, `W`=Way, `V`=Virtual stop, `N`=Address |
| `stadt` | string | — | City (German) |
| `stadtteil` | string | — | District/neighborhood (German) |
| `streetname` | string | — | Street name |
| `housenumber` | string | — | House number |
| `priority` | number | double | Priority/ranking score |
| `sim` | number | double | Similarity score |
| `tags` | object | — | Arbitrary key-value map for OSM/GTFS tags (e.g. `{"stop_id":"0011072","zone_id":"110","wheelchair_boarding":null}`) |

---

### TriasWrapperDto

Top-level wrapper for TRIAS and TRIAS12 format responses.

`additionalProperties: false`

| Property | Type | Nullable | Description |
|---|---|---|---|
| `serviceDelivery` | ServiceDelivery | No | Contains the delivery payload |
| `version` | string | Yes | `"1.1"` for TRIAS, `"1.2"` for TRIAS12 |

---

### ServiceDelivery

`additionalProperties: false`

| Property | Type | Description |
|---|---|---|
| `deliveryPayload` | DeliveryPayload | Holds the location information response |

---

### DeliveryPayload

`additionalProperties: false`

| Property | Type | Description |
|---|---|---|
| `locationInformationResponse` | LocationInformationResponse | The actual search results |

---

### LocationInformationResponse

The key difference between TRIAS and TRIAS12 is which array field is populated.

`additionalProperties: false`

| Property | Type | Nullable | Description |
|---|---|---|---|
| `errorMessage` | string[] | Yes | Error messages, if any |
| `location` | TriasLocationElement[] | Yes | Results array — **only set if format is `TRIAS`** |
| `locationResult` | TriasLocationElement[] | Yes | Results array — **only set if format is `TRIAS12`** |

---

### TriasLocationElement

A single location result in the TRIAS response.

`additionalProperties: false`

**Required**: `location`

| Property | Type | Nullable | Description |
|---|---|---|---|
| `location` | Point | No | The location data (**required**) |
| `complete` | boolean | Yes | Whether the result is a complete match |
| `probability` | number (double) | Yes | Match probability/confidence (e.g. `0.7`) |

---

### Point

Core location data object. Contains geo coordinates, extension metadata, and display names.

`additionalProperties: false`

| Property | Type | Nullable | Description |
|---|---|---|---|
| `geoPosition` | GeoPosition | No | Lat/lon coordinates |
| `attribute` | array (any) | Yes | Untyped array (empty in all examples) |
| `extension` | Extension | No | Category tags + custom metadata |
| `complete` | boolean | Yes | Whether location data is complete |
| `locationName` | PoiAddressLocationName[] | Yes | Display name(s) with optional language |
| `probability` | number (double) | Yes | Match probability |

> **Note**: In response examples, `Point` also contains inline sub-objects (`stopPlace`, `pointOfInterest`, `address`) that are **not formally defined in the schema** but appear in example payloads. These represent the actual location entity:
> - `stopPlace` — with `stopPlaceRef.value`, `stopPlaceName[]`, `privateCode[]`, `nameSuffix[]`
> - `pointOfInterest` — with `pointOfInterestCode`, `pointOfInterestName[]`, `pointOfInterestCategory[]`, `privateCode[]`, `nameSuffix[]`
> - `address` — with `addressCode`, `addressName[]`, `privateCode[]`, `nameSuffix[]`

---

### GeoPosition

`additionalProperties: false`

| Property | Type | Format | Nullable | Description |
|---|---|---|---|---|
| `longitude` | number | double | Yes | Longitude |
| `latitude` | number | double | Yes | Latitude |

---

### Extension

Metadata extension with category tags and custom details.

`additionalProperties: false`

| Property | Type | Nullable | Description |
|---|---|---|---|
| `category` | string[] | Yes | Category tags (e.g. `["custom", "S", "lvb_ac"]`). Second element maps to `ptype`. |
| `custom` | CustomExtension | No | Custom metadata |

---

### CustomExtension

Rich metadata about the location — address details, classification, and tags.

`additionalProperties: false`

All properties are **nullable** and **optional**.

| Property | Type | Description |
|---|---|---|
| `external_reference` | string | External reference ID |
| `data` | string | Full display string |
| `streetName` | string | Street name |
| `streetNumber` | string | House/street number |
| `postalcode` | string | Postal code |
| `district` | string | District/neighborhood |
| `city` | string | City name |
| `county` | string | County/Landkreis |
| `tags` | object | Arbitrary key-value map for OSM tags |
| `ptype` | string | Point type code (`S`, `P`, `W`, `V`, `N`) |
| `countryCode` | string | ISO country code (e.g. `"DE"`) |

---

### PoiAddressLocationName

Display name for a location with optional language tag.

`additionalProperties: false`

| Property | Type | Nullable | Description |
|---|---|---|---|
| `text` | string | Yes | Display text |
| `language` | string | Yes | Language code |

---

## Response Hierarchy Diagrams

### JSON Format (OldFormatDto)

```
OldFormatDto[]                    (flat array — recommended)
└── OldFormatDto
    ├── ExtraOrder                int32
    ├── data                      string (full display string)
    ├── id                        string (unique ID)
    ├── name                      string (display name)
    ├── ptype                     string (S/P/W/V/N)
    ├── lat                       double
    ├── lon                       double
    ├── stadt                     string (city)
    ├── stadtteil                 string (district)
    ├── landkreis                 string (county)
    ├── postalcode                string
    ├── streetname                string
    ├── housenumber               string
    ├── priority                  double (ranking)
    ├── sim                       double (similarity)
    └── tags                      object (OSM/GTFS tags)
```

### TRIAS Format (v1.1)

```
TriasWrapperDto
├── version                                     "1.1"
└── serviceDelivery ──> ServiceDelivery
    └── deliveryPayload ──> DeliveryPayload
        └── locationInformationResponse ──> LocationInformationResponse
            ├── errorMessage[]                  string[]
            └── location[] ──> TriasLocationElement[]       ★ "location" field
                ├── complete                    boolean
                ├── probability                 double
                └── location ──> Point                      ★ required
                    ├── geoPosition ──> GeoPosition
                    │   ├── longitude           double
                    │   └── latitude            double
                    ├── attribute[]             any[]
                    ├── extension ──> Extension
                    │   ├── category[]          string[]
                    │   └── custom ──> CustomExtension
                    │       ├── external_reference  string
                    │       ├── data                string
                    │       ├── streetName           string
                    │       ├── streetNumber         string
                    │       ├── postalcode           string
                    │       ├── district             string
                    │       ├── city                 string
                    │       ├── county               string
                    │       ├── tags                 object
                    │       ├── ptype                string
                    │       └── countryCode          string
                    ├── complete                boolean
                    ├── locationName[] ──> PoiAddressLocationName[]
                    │   ├── text                string
                    │   └── language             string
                    └── probability             double
```

### TRIAS12 Format (v1.2)

Same structure as TRIAS v1.1, except:
- `version` = `"1.2"`
- Uses **`locationResult[]`** instead of `location[]` in `LocationInformationResponse`
- `CustomExtension` fields are fully populated (data, postalcode, district, city, county, tags)
- Location entities are properly typed (`stopPlace`, `pointOfInterest`, `address`)

---

## Schema Relationship Diagram

```
                    ┌─────────────────┐
                    │  OldFormatDto   │  (standalone, flat format)
                    └─────────────────┘

    ┌─────────────────┐
    │ TriasWrapperDto  │
    └────────┬────────┘
             │ serviceDelivery
             ▼
    ┌─────────────────┐
    │ ServiceDelivery  │
    └────────┬────────┘
             │ deliveryPayload
             ▼
    ┌─────────────────┐
    │ DeliveryPayload  │
    └────────┬────────┘
             │ locationInformationResponse
             ▼
    ┌──────────────────────────────┐
    │ LocationInformationResponse  │
    └──────┬───────────┬──────────┘
           │ location  │ locationResult
           │ (TRIAS)   │ (TRIAS12)
           ▼           ▼
    ┌──────────────────────┐
    │ TriasLocationElement │  (required: location)
    └──────────┬───────────┘
               │ location
               ▼
    ┌──────────┐
    │  Point   │
    └──┬──┬──┬─┘
       │  │  │
       │  │  └── locationName[] ──▶ PoiAddressLocationName { text, language }
       │  │
       │  └── extension ──────────▶ Extension
       │                               ├── category[]
       │                               └── custom ──▶ CustomExtension
       │                                   ├── external_reference, data
       │                                   ├── streetName, streetNumber
       │                                   ├── postalcode, district, city, county
       │                                   ├── tags, ptype, countryCode
       │
       └── geoPosition ──────────▶ GeoPosition { longitude, latitude }
```

---

## Schema Cross-Reference

| Schema | Referenced By |
|---|---|
| `OldFormatDto` | `/status` and `/search` 200 response (as array) |
| `TriasWrapperDto` | `/status` and `/search` 200 response |
| `ServiceDelivery` | `TriasWrapperDto.serviceDelivery` |
| `DeliveryPayload` | `ServiceDelivery.deliveryPayload` |
| `LocationInformationResponse` | `DeliveryPayload.locationInformationResponse` |
| `TriasLocationElement` | `LocationInformationResponse.location[]` and `.locationResult[]` |
| `Point` | `TriasLocationElement.location` |
| `GeoPosition` | `Point.geoPosition` |
| `Extension` | `Point.extension` |
| `CustomExtension` | `Extension.custom` |
| `PoiAddressLocationName` | `Point.locationName[]` |

### Schema Constraints Summary

| Schema | Has `required` fields? | `additionalProperties` |
|---|---|---|
| OldFormatDto | No | `false` |
| TriasWrapperDto | No | `false` |
| ServiceDelivery | No | `false` |
| DeliveryPayload | No | `false` |
| LocationInformationResponse | No | `false` |
| **TriasLocationElement** | **Yes** (`location`) | `false` |
| Point | No | `false` |
| GeoPosition | No | `false` |
| Extension | No | `false` |
| CustomExtension | No | `false` |
| PoiAddressLocationName | No | `false` |

All schemas are strict/closed (`additionalProperties: false`). Only `TriasLocationElement` declares a required field.

---

## Notable Quirks & Observations

1. **Undeclared sub-objects in `Point`**: The schema for `Point` does not define `stopPlace`, `pointOfInterest`, or `address` properties, but they appear in the response examples. These are the actual location entities but are not formally modeled in the OpenAPI spec.

2. **`location` field name collision**: `TriasLocationElement` has a property called `location` (of type `Point`), while `LocationInformationResponse` has a property called `location` (array of `TriasLocationElement`). This creates a confusing `location[].location` path.

3. **TRIAS v1.1 loses type information**: In TRIAS format, all locations appear as `pointOfInterest` regardless of actual type. TRIAS12 properly distinguishes `stopPlace`, `pointOfInterest`, and `address`.

4. **TRIAS v1.1 has sparse custom data**: Most `CustomExtension` fields are `null` in TRIAS v1.1 responses, while TRIAS12 populates them fully.

5. **`N` (Address) pointType is conditional**: Address results only appear when the search string contains a number.

6. **`withAddress` radius**: Address filling uses a max 40m radius and may be inaccurate for points outside buildings or inside large buildings.

7. **Almost everything nullable**: Every property across all schemas (except `$ref` properties and `TriasLocationElement.location`) is nullable. The API can return `null` for any field.

8. **`/status` returns search results**: The health check endpoint returns the same `oneOf[ OldFormatDto[], TriasWrapperDto ]` response in `application/json`, which is unusual for a health endpoint.

9. **German field names in OldFormatDto**: `stadt` (city), `stadtteil` (district), `landkreis` (county) use German names, while the rest of the API uses English.

10. **No `search` parameter is required**: The `search` query parameter is optional — the API presumably returns results even without a search string.
