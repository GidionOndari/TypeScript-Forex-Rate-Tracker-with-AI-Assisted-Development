export interface AppState {
  baseCurrency: string
  currentRates: Record<string, number> | null
  previousRates: Record<string, number> | null
  loading: boolean
  error: string | null
  lastSuccessfulRates: Record<string, number> | null
}

export const appState: AppState = {
  baseCurrency: 'USD',
  currentRates: null,
  previousRates: null,
  loading: false,
  error: null,
  lastSuccessfulRates: null,
}

export function setBaseCurrency(currency: string): void {
  appState.baseCurrency = currency
}

export function updateRatesWithSnapshot(newRates: Record<string, number>): void {
  appState.previousRates = appState.currentRates ? { ...appState.currentRates } : null
  appState.currentRates = { ...newRates }
  appState.lastSuccessfulRates = { ...newRates }
}

export function setRates(rates: Record<string, number>): void {
  updateRatesWithSnapshot(rates)
}

export function setLoading(value: boolean): void {
  appState.loading = value
}

export function setError(message: string | null): void {
  appState.error = message
}
