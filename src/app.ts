import { getLatestRates } from './api'
import { createCurrencySelector, renderError, renderLoadingSkeleton, renderRates } from './components'
import { appState, setBaseCurrency, setError, setLoading, updateRatesWithSnapshot } from './state/appState'

const DEFAULT_BASE_CURRENCY = 'USD'

function renderLayout(): string {
  return `
    <header id="dashboard-header">
      <h1>Forex Dashboard</h1>
      <p id="base-currency-display">Base Currency: ${appState.baseCurrency}</p>
    </header>
    <main id="dashboard-main">
      <section id="controls-section">
        <h2>Controls</h2>
        <div id="controls-container"></div>
        <p id="refresh-indicator">Idle</p>
      </section>
      <section id="rates-section">
        <h2>Rates</h2>
        <div id="rates-container"></div>
      </section>
    </main>
  `
}

function updateBaseCurrencyDisplay(): void {
  const baseCurrencyDisplay = document.getElementById('base-currency-display')

  if (baseCurrencyDisplay) {
    baseCurrencyDisplay.textContent = `Base Currency: ${appState.baseCurrency}`
  }
}

function updateRefreshIndicator(text: string): void {
  const refreshIndicator = document.getElementById('refresh-indicator')

  if (refreshIndicator) {
    refreshIndicator.textContent = text
  }
}

function renderFromState(container: HTMLElement, onRetry: () => void): void {
  if (appState.loading) {
    renderLoadingSkeleton()
    updateRefreshIndicator('Refreshing rates...')
    return
  }

  if (appState.error !== null) {
    if (appState.lastSuccessfulRates) {
      container.innerHTML = ''
      renderRates(appState.lastSuccessfulRates, appState.previousRates)

      const staleNotice = document.createElement('p')
      staleNotice.textContent = `Showing stale data. Latest update failed: ${appState.error ?? 'Unable to fetch exchange rates. Please try again.'}`
      staleNotice.style.marginTop = '12px'
      staleNotice.style.color = '#92400e'
      staleNotice.style.fontSize = '0.9rem'
      container.appendChild(staleNotice)

      const retryButton = document.createElement('button')
      retryButton.type = 'button'
      retryButton.textContent = 'Retry'
      retryButton.addEventListener('click', () => {
        onRetry()
      })
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
    setError(null)
    setLoading(true)
    renderFromState(ratesContainer, retryLoadRates)
    void loadRates(appState.baseCurrency)
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

      const message = error instanceof Error ? error.message : 'Failed to load exchange rates.'
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
  controlsContainer.appendChild(selector)

  await loadRates(DEFAULT_BASE_CURRENCY)
}
