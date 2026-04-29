import { calculateTrend } from '../utils'

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

export function renderLoadingSkeleton(rowCount = 7): void {
  const container = document.getElementById('rates-container')

  if (!container) {
    throw new Error('Rates container was not found.')
  }

  container.innerHTML = ''

  const skeletonWrapper = document.createElement('div')
  skeletonWrapper.setAttribute('aria-hidden', 'true')

  for (let index = 0; index < rowCount; index += 1) {
    const row = document.createElement('div')
    row.style.height = '18px'
    row.style.marginBottom = '10px'
    row.style.borderRadius = '6px'
    row.style.backgroundColor = '#e2e8f0'
    skeletonWrapper.appendChild(row)
  }

  container.appendChild(skeletonWrapper)
}

export function renderError(message: string, onRetry: () => void): void {
  const container = document.getElementById('rates-container')

  if (!container) {
    throw new Error('Rates container was not found.')
  }

  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.alignItems = 'center'
  wrapper.style.justifyContent = 'center'
  wrapper.style.gap = '10px'
  wrapper.style.minHeight = '160px'
  wrapper.style.textAlign = 'center'

  const errorText = document.createElement('p')
  errorText.textContent = message

  const retryButton = document.createElement('button')
  retryButton.type = 'button'
  retryButton.textContent = 'Retry'
  retryButton.addEventListener('click', onRetry)

  wrapper.appendChild(errorText)
  wrapper.appendChild(retryButton)
  container.appendChild(wrapper)
}

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
  const ratesList = document.createElement('div')
  ratesList.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

  Object.entries(rates).forEach(([currency, value]) => {
    const row = document.createElement('div')
    row.style.display = 'flex'
    row.style.alignItems = 'center'
    row.style.gap = '8px'
    row.style.marginBottom = '6px'

    const code = document.createElement('span')
    code.textContent = currency
    code.style.display = 'inline-block'
    code.style.width = '48px'

    const separator = document.createElement('span')
    separator.textContent = '|'
    separator.style.opacity = '0.7'

    const amount = document.createElement('span')
    amount.textContent = value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    })
    amount.style.display = 'inline-block'
    amount.style.width = '88px'

    const trend = document.createElement('span')
    trend.textContent = getTrendSymbol(trends[currency])
    trend.style.display = 'inline-block'
    trend.style.width = '16px'

    row.appendChild(code)
    row.appendChild(separator)
    row.appendChild(amount)
    row.appendChild(trend)
    ratesList.appendChild(row)
  })

  container.appendChild(ratesList)
}
