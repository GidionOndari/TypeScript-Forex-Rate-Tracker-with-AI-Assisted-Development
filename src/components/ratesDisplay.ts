import { calculateTrend } from '../utils'
import { appState } from '../state/appState'

let rateFilterQuery = ''
let rateSortMode: 'alphabetical' | 'value-desc' = 'alphabetical'

/** Maps trend state to compact glyphs to keep table cells visually lightweight. */
function getTrendSymbol(trend: 'up' | 'down' | 'stable' | 'new'): string {
  switch (trend) {
    case 'up':
      return '↑'
    case 'down':
      return '↓'
    case 'stable':
      return '→'
    case 'new':
      return '✳'
  }
}

/**
 * Builds a compact horizontal bar chart from current rates.
 * Uses top 10 descending values so users can quickly identify strongest pairs.
 */
function createTopCurrenciesChart(
  rates: Record<string, number>,
  previousRates: Record<string, number> | null,
): HTMLElement {
  const chartCard = document.createElement('section')
  chartCard.className = 'rates-chart'

  const chartTitle = document.createElement('h3')
  chartTitle.className = 'rates-chart-title'
  chartTitle.textContent = 'Top currency movers vs base'
  chartCard.appendChild(chartTitle)

  const sortedCurrencies = Object.entries(rates).sort(([, valueA], [, valueB]) => valueB - valueA)
  const strongestCurrencies = sortedCurrencies.slice(0, 5)
  const weakestCurrencies = sortedCurrencies.slice(-5).reverse()
  const chartGroups = [
    { title: 'Strongest (Top 5)', currencies: strongestCurrencies },
    { title: 'Weakest (Bottom 5)', currencies: weakestCurrencies },
  ]

  const trends = calculateTrend(rates, previousRates)

  const keyCurrencies = new Set(['USD', 'EUR', 'GBP', 'KES'])

  const globalMaxRate = sortedCurrencies[0]?.[1] ?? 1
  const globalMinRate = sortedCurrencies[sortedCurrencies.length - 1]?.[1] ?? 0
  const valueRange = Math.max(globalMaxRate - globalMinRate, 0.0001)

  chartGroups.forEach((group) => {
    const groupTitle = document.createElement('h4')
    groupTitle.className = 'chart-group-title'
    groupTitle.textContent = group.title
    chartCard.appendChild(groupTitle)

    const chartRows = document.createElement('div')
    chartRows.className = 'chart-rows'

    group.currencies.forEach(([currency, value]) => {
      const row = document.createElement('div')
      row.className = 'chart-row'

      if (keyCurrencies.has(currency)) {
        row.classList.add('chart-row-key')
      }

      const label = document.createElement('span')
      label.className = 'chart-label'
      label.textContent = currency

      const barTrack = document.createElement('div')
      barTrack.className = 'chart-bar-track'

      const barFill = document.createElement('div')
      barFill.className = 'chart-bar-fill'
      barFill.style.width = `${Math.max(6, ((value - globalMinRate) / valueRange) * 100)}%`

      const valueLabel = document.createElement('span')
      valueLabel.className = 'chart-value'
      valueLabel.textContent = value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })

      const trendLabel = document.createElement('span')
      trendLabel.className = `chart-trend trend-${trends[currency]}`
      trendLabel.textContent = getTrendSymbol(trends[currency])

      barTrack.appendChild(barFill)
      row.append(label, barTrack, valueLabel, trendLabel)
      chartRows.appendChild(row)
    })

    chartCard.appendChild(chartRows)
  })

  return chartCard
}

/**
 * Renders placeholder rows while waiting for fresh rates.
 * Skeleton rows preserve page layout and reduce content jump.
 */
export function renderLoadingSkeleton(rowCount = 7): void {
  const container = document.getElementById('rates-container')

  if (!container) {
    throw new Error('Rates container was not found.')
  }

  container.innerHTML = ''

  const skeletonWrapper = document.createElement('div')
  skeletonWrapper.className = 'skeleton-wrapper'
  skeletonWrapper.setAttribute('aria-hidden', 'true')

  for (let index = 0; index < rowCount; index += 1) {
    const row = document.createElement('div')
    row.className = 'skeleton-row'
    skeletonWrapper.appendChild(row)
  }

  container.appendChild(skeletonWrapper)
}

/**
 * Displays a recoverable error panel with retry action.
 * The callback is injected by the app so request coordination stays centralized.
 */
export function renderError(errorMessage: string | null | undefined, onRetryClick: () => void): void {
  const container = document.getElementById('rates-container')

  if (!container) {
    throw new Error('Rates container was not found.')
  }

  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'status-panel error-panel fade-in'

  const errorText = document.createElement('p')
  errorText.textContent = errorMessage ?? 'Unable to fetch exchange rates. Please check your connection and try again.'
  errorText.className = 'status-message status-error'

  const retryButton = document.createElement('button')
  retryButton.type = 'button'
  retryButton.textContent = 'Retry'
  retryButton.className = 'btn'
  retryButton.addEventListener('click', onRetryClick)

  wrapper.appendChild(errorText)
  wrapper.appendChild(retryButton)
  container.appendChild(wrapper)
}

/**
 * Renders filter/sort controls, tabular rates, and a strength chart.
 *
 * Data transformation:
 * - rates are filtered by code, then sorted per selected mode.
 * - numeric values are locale-formatted for scanning and comparison.
 *
 * Edge case:
 * - empty filter result shows a message instead of an empty table.
 */
export function renderRates(
  rates: Record<string, number>,
  previousRates: Record<string, number> | null = null,
): void {
  const container = document.getElementById('rates-container')

  if (!container) {
    throw new Error('Rates container was not found.')
  }

  container.innerHTML = ''

  const trends = calculateTrend(rates, previousRates)
  const toolbar = document.createElement('div')
  toolbar.className = 'rates-toolbar'

  const searchInput = document.createElement('input')
  searchInput.type = 'search'
  searchInput.placeholder = 'Filter currency (e.g., EUR)'
  searchInput.className = 'rates-filter-input'
  searchInput.value = rateFilterQuery
  searchInput.addEventListener('input', () => {
    rateFilterQuery = searchInput.value.trim().toUpperCase()
    renderRates(rates, previousRates)
  })

  const sortSelect = document.createElement('select')
  sortSelect.className = 'rates-sort-select'

  const alphabetical = document.createElement('option')
  alphabetical.value = 'alphabetical'
  alphabetical.textContent = 'Sort: A–Z'

  const byValue = document.createElement('option')
  byValue.value = 'value-desc'
  byValue.textContent = 'Sort: Highest rate'

  sortSelect.append(alphabetical, byValue)
  sortSelect.value = rateSortMode
  sortSelect.addEventListener('change', () => {
    rateSortMode = sortSelect.value === 'value-desc' ? 'value-desc' : 'alphabetical'
    renderRates(rates, previousRates)
  })

  toolbar.append(searchInput, sortSelect)

  const table = document.createElement('div')
  table.className = 'rates-table fade-in'

  const headerRow = document.createElement('div')
  headerRow.className = 'rates-table-header'
  headerRow.innerHTML = '<span>Currency</span><span>Rate</span>'
  table.appendChild(headerRow)

  const filteredEntries = Object.entries(rates)
    .filter(([currency]) => currency.includes(rateFilterQuery))
    .sort(([currencyA, valueA], [currencyB, valueB]) => {
      if (rateSortMode === 'value-desc') {
        return valueB - valueA
      }

      return currencyA.localeCompare(currencyB)
    })

  filteredEntries.forEach(([currency, value], index) => {
    const row = document.createElement('div')
    row.className = 'rate-row'
    row.dataset.row = index % 2 === 0 ? 'even' : 'odd'

    const code = document.createElement('span')
    code.textContent = currency
    code.className = 'rate-code'

    if (currency === appState.baseCurrency) {
      code.classList.add('rate-code-base')
    }

    const amount = document.createElement('span')
    amount.textContent = value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
    amount.className = 'rate-amount'
    amount.title = `Trend: ${getTrendSymbol(trends[currency])}`

    row.appendChild(code)
    row.appendChild(amount)
    table.appendChild(row)
  })

  if (filteredEntries.length === 0) {
    const empty = document.createElement('p')
    empty.textContent = 'No currencies match your filter.'
    empty.className = 'status-message'
    container.append(toolbar, empty)
    return
  }

  const chart = createTopCurrenciesChart(rates, previousRates)
  container.append(toolbar, table, chart)
}
