import type { ExchangeRatesResponse } from '../types'
import { request } from '../utils'

const EXCHANGE_RATE_HOST_BASE_URL = 'https://api.exchangerate.host'

/**
 * Fetches the latest exchange rates for a provided base currency.
 */
export async function getLatestRates(baseCurrency: string): Promise<ExchangeRatesResponse> {
  const normalizedBase = baseCurrency.trim().toUpperCase()

  if (!normalizedBase) {
    throw new Error('Base currency is required.')
  }

  const url = `${EXCHANGE_RATE_HOST_BASE_URL}/latest?base=${encodeURIComponent(normalizedBase)}`
  const data: unknown = await request(url)

  if (!isExchangeRatesResponse(data)) {
    throw new Error('Invalid ExchangeRate.host response shape.')
  }

  return data
}

function isExchangeRatesResponse(value: unknown): value is ExchangeRatesResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ExchangeRatesResponse>

  return (
    typeof candidate.base === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.rates === 'object' &&
    candidate.rates !== null &&
    Object.values(candidate.rates).every((rate) => typeof rate === 'number')
  )
}
