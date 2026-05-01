# Forex Rate Tracker Dashboard

## 1) Project Title
**Forex Rate Tracker Dashboard**

## 2) Description
A production-style Forex dashboard built with TypeScript and Vite. The app fetches latest exchange rates from the Frankfurter API, normalizes responses, and renders a responsive UI with trend indicators, filtering/sorting, and clear loading/error/success states.

## 3) Features
- Real-time exchange rate retrieval from Frankfurter
- Base currency selection (`USD`, `EUR`, `GBP`, `JPY`, `KES`)
- Latest exchange rates retrieval from Frankfurter
- API integration through a dedicated service layer (`getLatestRates`)
- Snapshot-based trend detection (`up`, `down`, `stable`, `new`)
- Rates table with search and sort controls
- Top-10 strongest currencies bar visualization
- Skeleton loading state, retryable error state, and status badges
- Graceful error handling with retry flow and stale-data fallback
- Responsive layout with light/dark theme support
- Resilient HTTP layer with timeout and bounded retry/backoff

## 4) Tech Stack
- **TypeScript**
- **Vite**
- **Fetch API**
- **CSS** (custom properties + responsive layout)
- **Vanilla DOM APIs** (no framework)
- **Frankfurter API** (`https://api.frankfurter.app`)
- **CSS variables** for theming and design system consistency

## 5) Architecture Overview
```text
src/
├─ api/
│  └─ exchangeRateService.ts     # API orchestration + response normalization
├─ components/
│  ├─ currencySelector.ts        # Base-currency control
│  └─ ratesDisplay.ts            # Rates table, states, filtering/sorting, chart
├─ state/
│  └─ appState.ts                # Central app snapshot state
├─ types/
│  └─ exchangeRates.ts           # Runtime-safe value conversion/types
├─ utils/
│  ├─ httpClient.ts              # Fetch timeout, retry, error normalization
│  └─ trends.ts                  # Trend derivation between snapshots
├─ styles/
│  └─ main.css                   # Design tokens + responsive dashboard styling
└─ app.ts                        # App composition + state-driven rendering flow
```

### Project structure notes
- **`src/api`**: service entry points that encapsulate external API communication.
- **`src/config`**: environment-driven configuration (`VITE_API_BASE_URL`) and base URL normalization.
- **`src/utils`**: transport reliability and shared pure utilities (retry/timeout/trend calculation).
- **`src/types`**: domain types and runtime-safe rate conversions used during normalization.

## 6) Setup Instructions (Step-by-Step)
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TypeScript-Forex-Rate-Tracker-with-AI-Assisted-Development
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create environment file (optional override)**
   ```bash
   cp .env.example .env
   ```
   If `.env.example` is not present, create `.env` manually (see section 7).
4. **Run in development**
   ```bash
   npm run dev
   ```
5. **Build for production**
   ```bash
   npm run build
   ```
6. **Preview production build**
   ```bash
   npm run preview
   ```

## 7) Environment Variables
The app supports a configurable API base URL:

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `https://api.frankfurter.app` | Base URL for latest rates API calls |

Example `.env`:
```bash
VITE_API_BASE_URL=https://api.frankfurter.app
```

## 8) API Used (Frankfurter)
- **Provider:** Frankfurter
- **Docs:** https://www.frankfurter.app/docs/
- **Endpoint used:** `GET /latest?from={BASE}`
- **Example:** `https://api.frankfurter.app/latest?from=USD`

The app validates and normalizes API data before rendering to protect UI logic from malformed payloads.

### API Integration
- The dashboard integrates with **Frankfurter API** for latest exchange rates.
- Endpoint pattern: **`/latest?from=BASE`**.
- **No API key is required**, which keeps frontend setup simple.
- Frankfurter was selected for this project because it is stable, free to use, and does not require auth for core latest-rate use cases.

## 9) How It Works (Data Flow)
1. App mounts and renders dashboard layout.
2. User selects a base currency (default `USD`).
3. `getLatestRates(base)` calls the configured Frankfurter endpoint.
4. `request()` applies timeout/retry behavior and parses JSON.
5. Rates are normalized into a strict numeric `Record<string, number>`.
6. State snapshot updates:
   - `previousRates` ← old `currentRates`
   - `currentRates` ← latest normalized rates
7. UI renders:
   - loading skeleton during requests
   - error panel + retry on failures
   - rates table with filter/sort controls
   - top-10 strongest currencies visualization
   - status badge updates (`loading`, `success`, `error`, `neutral`)

Flow summary: **UI → service → API → normalization → render**.

## Error Handling
- Request failures are captured in the HTTP utility and normalized into consistent error messages.
- Timeouts and transient failures are retried with bounded exponential backoff.
- On failure, the UI shows a styled error panel with a retry action.
- If previous successful data exists, stale data can still be shown to avoid a blank screen.

## 10) Screenshots (Placeholders)
> Replace these with real images from your running app.

- `docs/screenshots/dashboard-overview.png` — full dashboard
- `docs/screenshots/rates-table-filter-sort.png` — table controls in action
- `docs/screenshots/loading-state.png` — skeleton loading state
- `docs/screenshots/error-state.png` — retryable error panel

Markdown example:
```md
![Dashboard Overview](docs/screenshots/dashboard-overview.png)
```

## 11) Future Improvements
- Richer charts and comparative visualizations
- Historical rates exploration (date-range and trend views)
- Historical trend charts (multi-day/time-series)
- Currency favorites and pinning
- Local caching to reduce repeated requests
- UI theming presets (for example compact/high-contrast variants)
- Better accessibility audits (keyboard focus paths + ARIA enhancements)
- Optional framework migration for larger component ecosystems

## 12) License
This project is currently **unlicensed**.

If you plan to distribute or open-source it, add a standard license file (for example MIT, Apache-2.0, or GPL-3.0).
