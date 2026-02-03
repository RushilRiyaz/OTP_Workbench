# OTP Client v2

A developer tool for LVB (Leipziger Verkehrsbetriebe) routing developers to test and compare routing APIs across environments.

<!-- CI Badges - Update URLs with your actual repository paths -->
![GitHub Actions](https://github.com/YOUR_USERNAME/otp-client-v2/actions/workflows/e2e-tests.yml/badge.svg)
![Azure DevOps](https://dev.azure.com/YOUR_ORG/YOUR_PROJECT/_apis/build/status/otp-client-v2?branchName=main)

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet + react-leaflet
- **Testing**: Selenium WebDriver

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- Google Chrome (for E2E tests)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd otp-client-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.lmservices.mobilityinnovate.net/api
NEXT_PUBLIC_API_KEY=<your-api-key>
```

## Running the App

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### E2E Tests

The project includes Selenium WebDriver-based end-to-end tests.

```bash
# Run tests with visible browser (for local development)
npm run dev          # Terminal 1: Start dev server
npm run test:e2e:local  # Terminal 2: Run tests

# Run tests headless (CI mode)
npm run dev          # Terminal 1: Start dev server
npm run test:e2e:ci     # Terminal 2: Run tests headless
```

### Test Coverage

The E2E test suite covers:

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

### GitHub Actions

E2E tests run automatically on:
- Push to `main`, `dev`, or `feature/**` branches
- Pull requests to `main` or `dev`

Workflow file: `.github/workflows/e2e-tests.yml`

### Azure DevOps

E2E tests run automatically on:
- Push to `main`, `dev`, or `feature/*` branches
- Pull requests to `main` or `dev`

Pipeline file: `azure-pipelines.yml`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run E2E tests (requires server running) |
| `npm run test:e2e:ci` | Run E2E tests headless |
| `npm run test:e2e:local` | Run E2E tests with visible browser |

## Developers

- [Ayman Kandouli](https://www.linkedin.com/in/ayman-kandouli-6a493b21a/)
- [Rushil Riyaz](https://github.com/RushilRiyaz)
- [Valentino Toscano](https://github.com/ToscanoValentin)
