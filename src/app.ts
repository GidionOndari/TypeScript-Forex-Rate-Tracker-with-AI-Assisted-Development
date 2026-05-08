import { getLatestRates } from './api'
import { createCurrencySelector, renderLoadingSkeleton, renderRates } from './components'
import { renderVerificationBoundary } from './components/truth/VerificationBoundary'
import { useVerifiedFreshness } from './hooks/truth/useVerifiedFreshness'
import { appState, setBaseCurrency, setError, setLoading, updateRatesWithSnapshot } from './state/appState'
import { toRatesViewModel } from './adapters/truth/ratesViewModel'
import { createVerificationScheduler } from './infrastructure/truth/verificationScheduler'

const DEFAULT_BASE_CURRENCY = 'USD'

function renderLayout(): string {
  return `
    <header id="dashboard-header" class="card">
      <div>
        <h1>Forex Dashboard</h1>
        <p id="base-currency-display">Base Currency: ${appState.baseCurrency}</p>
      </div>
    </header>
    <main id="dashboard-main">
      <section id="controls-section" class="card">
        <h2>Controls</h2>
        <div id="controls-container"></div>
        <p id="refresh-indicator">Idle</p>
      </section>
      <section id="rates-section" class="card">
        <h2>Rates</h2>
        <div id="rates-container"></div>
      </section>
    </main>
  `
}

/** Keeps header base currency in sync with latest successful API response. */
function updateBaseCurrencyDisplay(): void {
  const baseCurrencyDisplay = document.getElementById('base-currency-display')

  if (baseCurrencyDisplay) {
    baseCurrencyDisplay.textContent = `Base Currency: ${appState.baseCurrency}`
  }
}

/**
 * Converts refresh lifecycle text into semantic badge states.
 * This keeps UX feedback centralized and avoids repeating class logic.
 */
function updateRefreshIndicator(text: string): void {
  const refreshIndicator = document.getElementById('refresh-indicator')

  if (refreshIndicator) {
    refreshIndicator.textContent = text
    refreshIndicator.className = 'status-badge'

    if (text.includes('failed')) {
      refreshIndicator.classList.add('badge-error')
      return
    }

    if (text.includes('Refreshing')) {
      refreshIndicator.classList.add('badge-loading')
      return
    }

    if (text.includes('updated')) {
      refreshIndicator.classList.add('badge-success')
      return
    }

    refreshIndicator.classList.add('badge-neutral')
  }
}

/**
 * Renders rates panel from current state snapshot.
 * Handles loading, error with stale fallback, and success paths in one place.
 */
function renderFromState(container: HTMLElement, onRetry: () => void): void {
  if (appState.loading) {
    renderLoadingSkeleton()
    updateRefreshIndicator('Awaiting backend verification')
    return
  }

  if (appState.error != null) {
renderVerificationBoundary(container, { state: 'unavailable', reason: appState.error }, () => undefined, onRetry)
    updateRefreshIndicator('Verification unavailable')
    return
  }

  if (!appState.currentRates) {
renderVerificationBoundary(container, { state: 'unverified', reason: 'Awaiting backend verification.' }, () => undefined, onRetry)
    updateRefreshIndicator('Awaiting backend verification')
    return
  }

  const freshness = useVerifiedFreshness({
    asOf: appState.lastVerifiedDate,
    verificationStatus: 'verified',
  })

  const viewModel = toRatesViewModel({
    base: appState.baseCurrency,
    date: appState.lastVerifiedDate,
    rates: appState.currentRates,
  })

  const effectiveState = freshness.state === 'verified' ? viewModel : freshness

  renderVerificationBoundary(
    container,
    effectiveState,
    (verifiedData) => {
      renderRates(verifiedData.rates, appState.previousRates)
    },
    onRetry,
  )

  updateRefreshIndicator(effectiveState.state === 'verified' ? 'Verified' : effectiveState.reason)
}

export async function renderApp(): Promise<void> {
  const root = document.getElementById('app')

  if (!root) {
    throw new Error('Root element with id="app" was not found.')
  }

  root.innerHTML = renderLayout()

  const controlsContainer = document.getElementById('controls-container')
  const ratesContainer = document.getElementById('rates-container')

  if (!controlsContainer || !ratesContainer) {
    throw new Error('Dashboard containers could not be initialized.')
  }

  let requestToken = 0
  const retryLoadRates = (): void => {
    const currentBaseCurrency = appState.baseCurrency
    setError(null)
    setLoading(true)
    renderFromState(ratesContainer, retryLoadRates)
    void loadRates(currentBaseCurrency)
  }

  const loadRates = async (baseCurrency: string): Promise<void> => {
    setBaseCurrency(baseCurrency)
    updateBaseCurrencyDisplay()
    setError(null)
    setLoading(true)
    renderFromState(ratesContainer, retryLoadRates)

    requestToken += 1
    const currentToken = requestToken

    try {
      const response = await getLatestRates(baseCurrency)

      if (currentToken !== requestToken) {
        return
      }

      updateRatesWithSnapshot(response.rates, response.date)
      setBaseCurrency(response.base)
      updateBaseCurrencyDisplay()
      setLoading(false)
      renderFromState(ratesContainer, retryLoadRates)
    } catch (error) {
      if (currentToken !== requestToken) {
        return
      }

      const message = error instanceof Error ? error.message : normalizeUnknownErrorMessage(error)
      setError(message)
      setLoading(false)
      renderFromState(ratesContainer, retryLoadRates)
    }
  }

  const selector = createCurrencySelector((selectedCurrency) => {
    if (selectedCurrency === appState.baseCurrency && !appState.error) {
      return
    }

    void loadRates(selectedCurrency)
  })

  selector.value = DEFAULT_BASE_CURRENCY
  const selectorLabel = document.createElement('label')
  selectorLabel.htmlFor = 'base-currency'
  selectorLabel.textContent = 'Base currency'
  selectorLabel.className = 'control-label'

  controlsContainer.append(selectorLabel, selector)

  await loadRates(DEFAULT_BASE_CURRENCY)

  const scheduler = createVerificationScheduler(() => {
    void loadRates(appState.baseCurrency)
  }, 60000)
  scheduler.start()
}

function normalizeUnknownErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown }

    if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
      return candidate.message
    }

    try {
      const serializedError = JSON.stringify(error)
      if (serializedError && serializedError !== '{}') {
        return serializedError
      }
    } catch {
      return 'Failed to load exchange rates.'
    }
  }

  return 'Failed to load exchange rates.'
}
