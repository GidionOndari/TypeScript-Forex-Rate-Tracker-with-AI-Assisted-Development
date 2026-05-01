import { getLatestRates } from './api'
import { createCurrencySelector, renderError, renderLoadingSkeleton, renderRates } from './components'
import { appState, setBaseCurrency, setError, setLoading, updateRatesWithSnapshot } from './state/appState'

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
    updateRefreshIndicator('Refreshing rates...')
    return
  }

  if (appState.error != null) {
    if (appState.lastSuccessfulRates) {
      container.innerHTML = ''
      renderRates(appState.lastSuccessfulRates, appState.previousRates)

      const staleNotice = document.createElement('p')
      staleNotice.textContent = `Showing stale data. Latest update failed: ${appState.error ?? 'Unable to fetch exchange rates. Please try again.'}`
      staleNotice.className = 'status-message status-warning'
      container.appendChild(staleNotice)

      const retryButton = document.createElement('button')
      retryButton.type = 'button'
      retryButton.textContent = 'Retry'
      retryButton.className = 'btn'
      retryButton.addEventListener('click', onRetry)
      container.appendChild(retryButton)

      updateRefreshIndicator('Showing stale data')
      return
    }

    renderError(appState.error, onRetry)
    updateRefreshIndicator('Last update failed')
    return
  }

  if (!appState.currentRates) {
    container.textContent = 'No rates available.'
    updateRefreshIndicator('Idle')
    return
  }

  container.innerHTML = ''
  renderRates(appState.currentRates, appState.previousRates)
  updateRefreshIndicator('Rates updated')
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

      updateRatesWithSnapshot(response.rates)
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
