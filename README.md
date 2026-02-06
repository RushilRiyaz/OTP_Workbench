# OTP Client v2

A developer tool for LVB (Leipziger Verkehrsbetriebe) routing developers to test and compare routing APIs across environments.

<!-- CI Badges -->
[![Tests](https://github.com/RushilRiyaz/OTP_Workbench/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/RushilRiyaz/OTP_Workbench/actions/workflows/e2e-tests.yml)

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet + react-leaflet
- **Unit Testing**: Vitest
- **E2E Testing**: Selenium WebDriver

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

1. **Node.js** (version 20 or later) — download from https://nodejs.org/ and install for your platform
2. **npm** (version 10 or later) — comes bundled with Node.js, no separate install needed
3. **Git** — download from https://git-scm.com/ and install for your platform
4. **Google Chrome** — required only for E2E tests, not needed for unit tests

After installing, open a terminal and verify:

```bash
node -v    # should show v20.x.x or higher
npm -v     # should show 10.x.x or higher
git --v    # should show git version 2.x.x or higher
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

The zip file you received should already contain a `.env.local` file in the project root (the same folder as `package.json`) with the correct API URLs and API key. No action needed — skip to the next step.

If the `.env.local` file is missing for any reason, create one in the project root with the following content:

```env
NEXT_PUBLIC_AUTOCOMPLETE_API_URL=https://api.lmservices.mobilityinnovate.net/api/autocomplete
NEXT_PUBLIC_OTP_API_URL=https://api.lmservices.mobilityinnovate.net/api/otp
NEXT_PUBLIC_API_KEY=<your-api-key>
```

Replace `<your-api-key>` with the API key from Eva's email.


## Running the Application

To start the development server, run:

```bash
npm run dev
```

Then open your browser and go to: [http://localhost:3000](http://localhost:3000)

The app will automatically reload when you make code changes.

To stop the server, press `Ctrl + C` in the terminal.

## Running Tests

### Unit Tests (no server needed)

Unit tests verify the core logic (validation, URL parameter handling, routing API client, request history, map utilities). They run instantly and do not require the app to be running.

To run all 72 unit tests:

```bash
npm run test
```

Expected output (all tests should pass):

```
 ✓ src/components/map/__tests__/utils.test.ts (5 tests)
 ✓ src/lib/__tests__/validation.test.ts (11 tests)
 ✓ src/lib/__tests__/routing.test.ts (22 tests)
 ✓ src/lib/__tests__/requestHistory.test.ts (13 tests)
 ✓ src/lib/__tests__/urlParams.test.ts (21 tests)

 Test Files  5 passed (5)
      Tests  72 passed (72)
```

To run tests in watch mode (tests re-run automatically when files change):

```bash
npm run test:watch
```

Press `q` to exit watch mode.

### E2E Tests (requires server + Chrome)

E2E tests use Selenium to automate a real browser and test the full application.

**Step 1**: Start the development server in one terminal:

```bash
npm run dev
```

**Step 2**: Open a second terminal and run:

```bash
npm run test:e2e:local
```

This will open a Chrome window and run through the test suite automatically.

For headless mode (no visible browser):

```bash
npm run test:e2e:ci
```

### Unit Test Coverage

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `validation.test.ts` | 11 | Input validation (start, destination, dateTime, travel modes) |
| `urlParams.test.ts` | 21 | URL serialization/deserialization for shareable links |
| `routing.test.ts` | 22 | Routing API client (URL building, response handling, error cases) |
| `requestHistory.test.ts` | 13 | localStorage request history (add, get, dedup, max size, corruption) |
| `map/utils.test.ts` | 5 | Coordinate extraction from location values |

### E2E Test Coverage

| Test | Description |
|------|-------------|
| Page load | Verifies the app loads successfully |
| Parameter area | Sidebar is visible |
| Tab navigation | 5 tabs displayed, can switch between them |
| Environment selection | PROD selected by default, can switch to STAGE/DEV |
| Location inputs | Can type start/destination locations |
| Swap functionality | Swap button exchanges start and destination |
| Map display | Leaflet map is visible |
| Collapse/expand | Parameter area sidebar toggles correctly |

## CI/CD

Both unit tests and E2E tests run automatically in CI on every push and pull request.

### GitHub Actions

Triggers on:
- Push to `main`, `dev`, or `feature/**` branches
- Pull requests to `main` or `dev`

Pipeline: unit tests run first, then build, then E2E tests.

Workflow file: `.github/workflows/e2e-tests.yml`

## All Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run E2E tests (requires server running) |
| `npm run test:e2e:ci` | Run E2E tests headless |
| `npm run test:e2e:local` | Run E2E tests with visible browser |

## Developers

- [Ayman Kandouli](https://www.linkedin.com/in/ayman-kandouli-6a493b21a/)
- [Rushil Riyaz](https://github.com/RushilRiyaz)
- [Valentino Toscano](https://github.com/ToscanoValentin)
