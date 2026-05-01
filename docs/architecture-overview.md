# Architecture Overview

## 1) Folder Structure Explanation

```text
.
├── src/
│   ├── config.ts
│   ├── app.ts
│   ├── main.ts
│   ├── api/
│   │   ├── exchangeRateService.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── currencySelector.ts
│   │   ├── ratesDisplay.ts
│   │   └── index.ts
│   ├── state/
│   │   └── appState.ts
│   ├── utils/
│   │   ├── httpClient.ts
│   │   ├── trends.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── exchangeRates.ts
│   │   └── index.ts
│   └── styles/
│       └── main.css
└── docs/
    └── architecture-overview.md
```

### What each top-level source area does
- **`src/main.ts`**: bootstraps the app.
- **`src/app.ts`**: orchestrates layout, state-driven rendering, and user interactions.
- **`src/state/`**: stores dashboard runtime state (`baseCurrency`, snapshots, loading, error).
- **`src/components/`**: UI rendering units (selector, rates table/chart, loading/error views).
- **`src/api/`**: service boundary for exchange rate retrieval.
- **`src/utils/`**: generic helpers (HTTP transport, retry/timeout, trend calculation).
- **`src/types/`**: type guards/normalizers for API value safety.
- **`src/styles/`**: design tokens, layout system, responsive styles.

---

## 2) Data Flow

### High-level flow

```text
[User Interaction]
      │
      ▼
[UI Components]
      │
      ▼
[app.ts Orchestration]
      │
      ▼
[api/exchangeRateService.ts]
      │
      ▼
[utils/httpClient.ts -> Frankfurter API]
      │
      ▼
[Normalization + Validation]
      │
      ▼
[state/appState.ts Snapshot Update]
      │
      ▼
[UI Re-render: table/chart/status]
```

### Requested sequence view: `UI → Service → API → Normalize → UI`

```text
UI Action (base currency change)
   → getLatestRates(base)
      → request("/latest?from=BASE")
         → Frankfurter response
      → normalize base/date/rates
   → update app state snapshots
→ UI re-renders with clean data
```

---

## 3) Responsibility of Each Layer

## `config`
- Centralizes runtime configuration (`VITE_API_BASE_URL`).
- Normalizes API origin to prevent malformed URL joins.
- Keeps environment handling outside business/UI code.

## `api/service`
- Exposes use-case function(s), primarily `getLatestRates(baseCurrency)`.
- Owns API-specific request shape and response expectations.
- Applies domain-level normalization (uppercase base, validated rates, fallback date/base).

## `utils`
- **`httpClient.ts`**: transport reliability (timeout, retry, HTTP/network error normalization).
- **`trends.ts`**: pure data derivation (current vs previous snapshot trend direction).
- Designed to stay reusable and framework-agnostic.

## `components`
- Renders concrete UI states (loading, error, success data views).
- Transforms already-normalized data into presentation elements (table/chart/labels).
- Avoids direct API calls; receives data via orchestration layer.

---

## 4) Design Decisions

### Why no API key
- Frankfurter provides public exchange-rate endpoints for the app’s scope.
- Removing API key handling simplifies onboarding and local setup.
- No secret management is needed in frontend runtime for current requirements.

### Why Frankfurter API
- Reliable, simple response model for latest rates.
- No-auth access is suitable for demo-to-production-style frontend dashboards.
- Endpoint semantics (`/latest?from=...`) map cleanly to base-currency UX.

### Why a normalization layer
- External APIs can vary in formatting and optional fields.
- Normalization provides a stable internal contract (`Record<string, number>` + base/date).
- Prevents rendering/runtime issues from malformed or non-numeric values.
- Keeps UI logic focused on presentation instead of defensive parsing.

---

## Supplemental Diagram: Layer Boundaries

```text
┌──────────────────────────────────────────────────────────┐
│ Presentation Layer (components, styles)                 │
│ - Selector, rates table/chart, loading/error states     │
└───────────────▲───────────────────────────────┬──────────┘
                │                               │
                │ state updates / render        │ events
┌───────────────┴───────────────────────────────▼──────────┐
│ Application Layer (app.ts + state)                       │
│ - Flow orchestration, snapshot lifecycle, retry wiring   │
└───────────────▲───────────────────────────────┬──────────┘
                │                               │
                │ normalized domain data        │ API calls
┌───────────────┴───────────────────────────────▼──────────┐
│ Domain/Service Layer (api + types normalization)         │
│ - getLatestRates, response validation, type safety       │
└───────────────▲───────────────────────────────┬──────────┘
                │                               │
                │ HTTP result                   │ outbound req
┌───────────────┴───────────────────────────────▼──────────┐
│ Infrastructure Layer (utils/httpClient + external API)   │
│ - timeout, retry, error mapping, Frankfurter transport   │
└──────────────────────────────────────────────────────────┘
```
