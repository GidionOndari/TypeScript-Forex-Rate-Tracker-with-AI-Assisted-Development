# Exchange Rate Request Pipeline (UI → API → Response)

## 1) UI trigger
- `renderApp()` builds the layout and calls `loadRates("USD")` on startup.
- Currency selector changes call `loadRates(selectedCurrency)` unless the selected currency is already active and there is no error.

## 2) App-level loading state
- `loadRates()` updates state to loading, clears errors, and renders a loading skeleton.
- It uses a `requestToken` counter to ignore stale responses from earlier requests.

## 3) API service call
- `loadRates()` calls `getLatestRates(baseCurrency)`.
- `getLatestRates()` normalizes input currency and builds:
  - `https://api.exchangerate.host/latest?base=<CURRENCY>`
- It calls `request(url)` to execute the HTTP call.

## 4) HTTP client behavior
- `request()` uses `fetch(url)`.
- If `fetch` rejects, it throws `Network error: unable to complete request.`
- If `response.ok` is false, it throws `HTTP error: <status> <statusText>`.
- Then it attempts `response.json()` and throws `Invalid response format: expected JSON.` on parse failure.

## 5) Response validation
- `getLatestRates()` validates JSON shape with `isExchangeRatesResponse()`:
  - requires `base` string
  - requires `date` string
  - requires `rates` object
  - requires every `rates` value to be a number
- Invalid shape throws `Invalid ExchangeRate.host response shape.`

## 6) Success path
- `loadRates()` stores new rates with a previous snapshot.
- Sets `baseCurrency` from response, clears loading, and re-renders the rates list.

## 7) Failure path
- `loadRates()` catch block stores the error message in state, clears loading, then re-renders.
- Render path checks only `appState.error` and displays generic UI text:
  - `Unable to fetch exchange rates. Please try again.`

## Silent-failure / low-observability points
1. UI masks specific error details
   - State stores the detailed error message, but `renderFromState()` always renders a generic message.
2. No console logging at failure boundaries
   - Neither `request()`, `getLatestRates()`, nor `loadRates()` logs URL, status, payload, or caught error details.
3. Stale request early-return is intentionally silent
   - When `currentToken !== requestToken`, both success and failure paths return without logging.
4. Retry button has no handler
   - Error UI renders a Retry button, but no click listener is attached, so it silently does nothing.

## Suggested logging additions
- In `request(url)`: log request URL, response status, and parse failure context.
- In `getLatestRates()`: log normalized base currency and shape-validation failures with sanitized payload preview.
- In `loadRates()` catch: log full error and base currency.
- In stale-request branch: `debug` log that an outdated response was ignored.
