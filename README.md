# Forex Dashboard (TypeScript + Vite)

## Description
This project is a lightweight Forex dashboard built with **TypeScript** and **Vite**. It fetches live exchange rates from the ExchangeRate.host API and displays them in a clean dashboard UI with trend indicators and robust loading/error handling.

### What the app does
- Retrieves latest exchange rates based on a selected base currency.
- Displays rates in a readable, aligned format.
- Shows trend direction (up/down/stable/new) between current and previous snapshots.
- Handles loading and failure states with dedicated UI rendering.

### What it demonstrates
- Type-safe frontend development with TypeScript.
- API integration with runtime response validation.
- Stateful UI updates with snapshot-based state management.
- Vanilla DOM rendering patterns without a framework.

## Features
- Live exchange rates from ExchangeRate.host
- Base currency selector (USD, EUR, GBP, JPY, KES)
- Trend indicators (`↑`, `↓`, `→`, `✳`)
- Loading skeleton UI
- User-friendly error UI with retry placeholder button

## Tech Stack
- **TypeScript**
- **Vite**
- **ExchangeRate.host API**
- **Vanilla DOM rendering**

## Installation & Run
```bash
npm install
npm run dev
```

Then open the local Vite URL shown in terminal (typically `http://localhost:5173`).

## Project Structure
```text
.
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── api
    │   ├── exchangeRateService.ts
    │   └── index.ts
    ├── app.ts
    ├── components
    │   ├── currencySelector.ts
    │   ├── index.ts
    │   └── ratesDisplay.ts
    ├── main.ts
    ├── state
    │   └── appState.ts
    ├── styles
    │   ├── index.css
    │   └── main.css
    ├── types
    │   ├── exchangeRates.ts
    │   └── index.ts
    └── utils
        ├── httpClient.ts
        ├── index.ts
        └── trends.ts
```

## Learning Outcomes
Working through this project helps reinforce:
- **API integration**: fetching and validating remote JSON responses.
- **State management**: handling current/previous snapshots and UI state transitions.
- **DOM rendering**: building reusable rendering utilities using vanilla DOM APIs.
- **TypeScript typing**: modeling API contracts and safer function boundaries.

## Future Improvements
- Add chart visualizations for historical and comparative trends.
- Introduce caching (in-memory or localStorage) to reduce repeated API calls.
- Migrate UI layer to a component framework (e.g., React/Vue/Svelte) for larger-scale maintainability.

## AI Prompt Journal

### 1) Purpose of Using AI in This Project
AI was used as a development accelerator to quickly scaffold, iterate, and refactor a TypeScript Forex dashboard while maintaining a clean architecture.

Primary goals for using AI:
- Speed up repetitive setup and boilerplate tasks.
- Generate modular first-pass implementations for API, state, and UI layers.
- Support rapid iteration on UX states (loading, error, success).
- Improve documentation quality and consistency.

### 2) Key Prompts Used (Summarized)
- "Initialize a Vite + TypeScript project in the current repository."
- "Create strict TypeScript interfaces for ExchangeRate.host latest response."
- "Build a reusable API service using fetch with robust error handling."
- "Create UI modules for selector, rates display, loading skeleton, and error states."
- "Add state management with snapshot updates and trend calculation."
- "Refactor app to wire selector changes to live API updates safely."
- "Polish layout and responsive styling without external CSS frameworks."
- "Create a testing checklist and professional README documentation."

### 3) Prompting Phases and Outcomes

#### Phase 0: Setup
**Prompt focus:** project initialization, folder structure, TypeScript/Vite baseline.

**Achieved:**
- Root project scaffold with entry files and TypeScript configuration.
- Organized `src/` modules for API, components, state, types, styles, and utils.

#### Phase 1: API Design
**Prompt focus:** API service architecture and typed responses.

**Achieved:**
- `getLatestRates(baseCurrency)` service function.
- Centralized HTTP utility wrapper.
- Runtime validation and meaningful error propagation.

#### Phase 2: UI Integration
**Prompt focus:** mount flow, dashboard layout, and rendering primitives.

**Achieved:**
- App shell with header, controls, and rates section.
- Currency selector integration with no page reload.
- Loading skeleton and error view rendering.

#### Phase 3: State + Trends
**Prompt focus:** state correctness and trend analysis.

**Achieved:**
- Snapshot-aware state updates (`currentRates` to `previousRates`).
- Trend calculator for up/down/stable/new states.
- Safer update sequencing for async fetch responses.

#### Phase 4: UI Refinement
**Prompt focus:** readability, responsiveness, and polished UX.

**Achieved:**
- Improved visual hierarchy and spacing.
- Aligned rate rows with trend indicators.
- Responsive CSS adjustments for smaller screens.

#### Phase 5: Testing + Docs
**Prompt focus:** quality checks and project communication.

**Achieved:**
- Structured manual testing checklist across API/state/UI/edge cases.
- Professional README with setup, architecture, and roadmap details.

### 4) Reflection

#### How AI Improved Development Speed
- Reduced scaffolding time and sped up iterative refactors.
- Helped maintain momentum across many small, incremental improvements.
- Produced consistent first-draft implementations and docs quickly.

#### What Still Required Human Debugging
- Validating environment limitations (e.g., package registry constraints).
- Verifying runtime behavior and state transitions in real UI flows.
- Reviewing edge cases and refining error semantics for production quality.

#### What Was Learned About Structuring Prompts
- Narrow, single-purpose prompts produce cleaner, easier-to-review changes.
- Defining explicit constraints ("no new features", "no frameworks") improves output precision.
- Phased prompting (setup → API → UI → state → polish → docs) yields better architecture than one large prompt.
