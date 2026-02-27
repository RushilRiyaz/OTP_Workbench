# OTP Client v2

A developer tool for LVB (Leipziger Verkehrsbetriebe) routing developers to test and compare OTP routing APIs across environments (PROD, STAGE, DEV).

<!-- CI Badges -->
[![CI](https://github.com/RushilRiyaz/OTP_Workbench/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/RushilRiyaz/OTP_Workbench/actions/workflows/e2e-tests.yml)

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet + react-leaflet
- **Internationalization**: next-intl (English + German)
- **Unit Testing**: Vitest (18 test files, 281 tests)
- **E2E Testing**: Selenium WebDriver (32 tests)

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

1. **Node.js** (version 24 or later) — download from https://nodejs.org/
2. **npm** (version 11 or later) — bundled with Node.js
3. **Git** — download from https://git-scm.com/
4. **Google Chrome** — only needed for E2E tests

After installing, verify in a terminal:

```bash
node -v          # should show v24.x.x or higher
npm -v           # should show 11.x.x or higher
git --version    # should show git version 2.x.x or higher
```

> **Note**: On Windows, you can use **Git Bash** (installed with Git), **PowerShell**, or **Command Prompt**. On macOS, use the built-in **Terminal** app. On Linux, use your default terminal.

## Step-by-Step Setup

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone <repository-url>
```

Then navigate into the project folder:

```bash
cd otp-client-v2
```

### 2. Install Dependencies

Run the following command. This will download all required packages:

```bash
npm install
```

This may take 1-2 minutes. Wait until it finishes completely.

### 3. Environment Variables

The zip file you received should already contain a `.env.local` file in the project root (same folder as `package.json`) with the correct API URLs and keys. **No action needed** — skip to the next step.

If `.env.local` is missing for any reason, create one in the project root by either running the following command or by copying the example:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and replace all `your-api-key-here` values with the API key from Eva's email.

The file configures API endpoints per service and per environment:

```env
# Autocomplete API Configuration (for Journey Definition - location search)
NEXT_PUBLIC_AUTOCOMPLETE_API_URL=https://api.lmservices.mobilityinnovate.net/api/autocomplete
NEXT_PUBLIC_AUTOCOMPLETE_API_KEY=your-api-key-here

# OTP Routing API (for Routing/Routing Comparison)
NEXT_PUBLIC_OTP_API_URL=https://api.lmservices.mobilityinnovate.net/api/otp
NEXT_PUBLIC_OTP_API_KEY=your-api-key-here

# StopMonitor API (future use)
NEXT_PUBLIC_STOPMONITOR_API_URL=https://api.lmservices.mobilityinnovate.net/api/stopMonitor
NEXT_PUBLIC_STOPMONITOR_API_KEY=your-api-key-here

# NearBySearch API (future use)
NEXT_PUBLIC_NEARBYSEARCH_API_URL=https://api.lmservices.mobilityinnovate.net/api/nearBySearch
NEXT_PUBLIC_NEARBYSEARCH_API_KEY=your-api-key-here

# General API Key (if needed for other services)
NEXT_PUBLIC_API_KEY=your-api-key-here

NEXT_PUBLIC_PROD_OTP_URL=https://api.lmservices.mobilityinnovate.net/api/otp
NEXT_PUBLIC_PROD_AUTOCOMPLETE_URL=https://api.lmservices.mobilityinnovate.net/api/autocomplete
NEXT_PUBLIC_PROD_API_KEY=your-api-key-here

NEXT_PUBLIC_STAGE_OTP_URL=https://api.lmservices.mobilityinnovate.net/apidev/otp
NEXT_PUBLIC_STAGE_AUTOCOMPLETE_URL=https://api.lmservices.mobilityinnovate.net/apidev/autocomplete
NEXT_PUBLIC_STAGE_API_KEY=your-api-key-here
```

Replace `<your-api-key>` with the API keys from Eva's email.


## Running the Application

To start the development server, run:

```bash
npm run dev
```

Open your browser and go to: [http://localhost:3000](http://localhost:3000)

The app will automatically reload when you make code changes. To stop the server, press `Ctrl + C`.

## Running Tests

### Unit Tests (no server needed)

```bash
npm run test          # run all 281 tests once
npm run test:watch    # re-run on file changes (press q to exit)
```

#### Unit Test Coverage (18 test files)

| Area | Tests | What's Tested |
|------|-------|---------------|
| Routing API | 34 | Location/date/time formatting, URL building, error handling, timeouts, custom params |
| Leg utilities | 39 | Timestamps, durations, delays, distances, colors, products, alert categories |
| Coordinate parsing | 33 | Lat/lon formats, boundary values, range validation, invalid input |
| Routing options | 27 | Travel mode structure, defaults, mode toggling, optional params |
| URL params | 21 | Serialize/deserialize form state, location encoding, round-trip correctness |
| Timeline utilities | 18 | Range computation, Y positioning, hour markers, height calculations |
| Request history | 14 | localStorage CRUD, dedup, cap at 20, corrupted data, display labels |
| Location history | 14 | Read/write, dedup by text, cap at 10, SSR safety |
| Validation | 11 | Start/dest/dateTime/travelModes checks, per-field error messages |
| Autocomplete | 13 | Input validation, URL building, API key header, abort handling |
| DateTimeInput | 8 | Berlin timezone utility, dark mode detection, input changes |
| Comparison types | 8 | Type constants, ENV_COLORS, helper functions |
| Comparison polylines | 8 | Hover opacity/weight calculation for all states |
| Detail comparison | 8 | Multi-column layout, selection, deselection |
| Comparison selection | 7 | Toggle logic, max 3 cap, immutability |
| Test fixtures | 7 | Factory functions produce valid default objects |
| Dark mode hook | 6 | HTML class detection, system preference, MutationObserver |
| Map utils | 5 | Coordinate extraction from all location types |

### E2E Tests (requires server + Chrome)

**Step 1**: Start the development server in one terminal:

```bash
npm run dev
```

**Step 2**: Open a second terminal and run:

```bash
npm run test:e2e:local
```

This will wait until the server is ready, then open a Chrome window and run through all 32 tests automatically.

For headless mode (no visible browser):

```bash
npm run test:e2e:ci
```

#### E2E Test Coverage (32 tests)

| # | Test | Description |
|---|------|-------------|
| 1 | Page load | App loads successfully |
| 2 | Parameter area | Left sidebar is visible |
| 3 | Tabs | 5 tabs displayed |
| 4 | Default tab | Routing tab active by default |
| 5 | Default env | PROD environment selected by default |
| 6 | Tab switching | Can switch to Routing Comparison and back |
| 7 | Collapse/expand | Parameter area sidebar toggles correctly |
| 8 | Env switching | Can switch to STAGE environment |
| 9 | Location input | Can type start location text |
| 10 | Swap | Swap button exchanges start and destination |
| 11 | Map | Leaflet map is visible on Routing tab |
| 12 | Dark mode | Theme toggle switches dark/light |
| 13 | DateTime | DateTime input accepts values |
| 14 | Submit routing | Submits a coordinate-based routing request |
| 15 | Results panel | Routing results panel appears after request |
| 16 | Itinerary select | Can select a different itinerary card |
| 17 | Times | Itinerary shows departure/arrival times (HH:MM) |
| 18 | Duration | Itinerary shows duration (min/h format) |
| 19 | Transfers | Shows transfer info (Direct or N transfers) |
| 20 | Transfer bar | Transfer scheme bar is rendered |
| 21 | Products | Product badges (transport lines) are displayed |
| 22 | Leg details | Selected card shows expanded leg details |
| 23 | Intermediate stops | Transit leg expands to show intermediate stops |
| 24 | Drag divider | Divider visible between map and results |
| 25 | Earlier/Later | Earlier & Later buttons are visible |
| 26 | Layout toggle | Switches between vertical/horizontal layout |
| 27 | JSON viewer | JSON tab shows raw API response |
| 28 | Clear dialog | Clear button shows confirmation dialog |
| 29 | Cancel clear | Cancelling returns to results |
| 30 | Confirm clear | Confirming removes results |
| 31 | AC env switch | Can switch autocomplete environment |
| 32 | Full autocomplete flow | Location autocomplete → routing → leg expansion → name validation |

## Project Structure

```
otp-client-v2/
├── messages/                    # i18n translations (EN + DE, ~220 keys each)
├── public/                      # Static assets (LVB logo, Leaflet assets)
├── e2e/                         # Selenium E2E tests (32 tests)
│   ├── config/driver.ts         #   Chrome WebDriver setup
│   ├── pages/HomePage.ts        #   Page Object Model (40+ helper methods)
│   └── runner.ts                #   Sequential test runner
├── src/
│   ├── app/
│   │   ├── layout.tsx           #   Root layout (Geist fonts)
│   │   ├── page.tsx             #   Redirects / → /en
│   │   ├── globals.css          #   LVB theme, dark mode, Tailwind 4, Leaflet styles
│   │   └── [locale]/
│   │       ├── layout.tsx       #   Locale provider + Header
│   │       └── page.tsx         #   Main page (all state + handlers, ~550 lines)
│   ├── components/
│   │   ├── Header.tsx           #   LVB-yellow header, logo, language/theme toggles
│   │   ├── ParameterArea.tsx    #   Collapsible left sidebar (drag-resizable)
│   │   ├── EvaluationArea.tsx   #   Right area: tabs + map + results/comparison
│   │   ├── Tabs.tsx             #   5-tab navigation
│   │   ├── JourneyForm.tsx      #   Location inputs + date/time + routing options + history
│   │   ├── LocationInput.tsx    #   Autocomplete/stopId/coords detection + dropdown
│   │   ├── DateTimeInput.tsx    #   Datetime picker with "Now" button
│   │   ├── RoutingOptionsForm.tsx # Travel modes, timing, optional/custom params
│   │   ├── EnvironmentSelector.tsx # PROD/STAGE/DEV + custom environment management
│   │   ├── RoutingResults.tsx   #   Itinerary list + JSON viewer + earlier/later
│   │   ├── ItineraryCard.tsx    #   Itinerary detail (legs, stops, delays, zones, alerts)
│   │   ├── RequestHistoryList.tsx # Past routing requests
│   │   ├── comparison/          #   FR13–FR17 comparison components
│   │   │   ├── TimelineComparisonLayout.tsx  # Horizontal + vertical timeline
│   │   │   ├── ComparisonOverviewLayout.tsx  # Gantt-chart overview
│   │   │   ├── DetailComparisonLayout.tsx    # Side-by-side itinerary detail
│   │   │   ├── EnvColumn.tsx                 # Per-environment column
│   │   │   ├── TimeAxis.tsx                  # Vertical time ruler
│   │   │   ├── TimelineTransferScheme.tsx    # Compact horizontal card
│   │   │   └── VerticalTransferSchemeStrip.tsx # Vertical stop-chain strip
│   │   └── map/                 #   Leaflet map components
│   │       ├── MapView.tsx      #     Map container + dark mode tiles
│   │       ├── RoutePolylines.tsx #   Single-itinerary polylines
│   │       ├── ComparisonRoutePolylines.tsx # Multi-itinerary polylines
│   │       ├── MapMarkers.tsx   #     Start/dest markers with SVG gradients
│   │       └── MapEvents.tsx    #     Click-to-set-location + reverse geocode
│   ├── lib/                     #   Utilities, API clients, types
│   │   ├── routing.ts           #     OTP routing API client + response types
│   │   ├── autocomplete.ts      #     Location search API client
│   │   ├── validation.ts        #     Form validation
│   │   ├── legUtils.ts          #     Leg formatting (times, colors, delays, distances)
│   │   ├── timelineUtils.ts     #     Timeline positioning math
│   │   ├── urlParams.ts         #     URL state serialization for shareable links
│   │   ├── requestHistory.ts    #     localStorage-backed request history
│   │   └── locationHistory.ts   #     localStorage-backed location history
│   ├── i18n/                    #   next-intl routing + locale config
│   └── test/                    #   Shared test fixtures + localStorage mock
├── .env.example                 # Environment variable template
├── .nvmrc                       # Node 24
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## CI/CD

### GitHub Actions

Triggers on push to `main`, `dev`, `feature/**` and pull requests to `main` or `dev`.

**Pipeline**: Unit tests → Build → E2E tests (sequential).

Workflow file: `.github/workflows/e2e-tests.yml`

## All Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all 281 unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run E2E tests (requires server running) |
| `npm run test:e2e:ci` | Run E2E tests headless |
| `npm run test:e2e:local` | Run E2E tests with visible browser |

## Developers

- [Ayman Kandouli](https://www.linkedin.com/in/ayman-kandouli-6a493b21a/)
- [Rushil Riyaz](https://www.linkedin.com/in/rushilriyaz/)
- [Valentino Toscano](https://www.linkedin.com/in/valentin-toscano-a6a649346/)
