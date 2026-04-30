import { appConfig } from '../config'
import { toExchangeRateNumber, type ExchangeRatesResponse } from '../types'
import { request } from '../utils'


/**
 * Fetch latest FX rates (Frankfurter API)
 */
export async function getLatestRates(baseCurrency: string): Promise<ExchangeRatesResponse> {
  const base = baseCurrency.trim().toUpperCase()

  if (!base) {
    throw new Error('Base currency is required.')
  }

  const url = `${appConfig.apiBaseUrl}/latest?from=${base}`

  const raw = await request(url)
  const data = raw as any

  if (!data?.rates) {
    throw new Error('Invalid API response')
  }

  const rates: Record<string, number> = {}

  for (const [key, value] of Object.entries(data.rates)) {
    const num = toExchangeRateNumber(value)
    if (num !== null) {
      rates[key] = num
    }
  }

  return {
    base: data.base || base,
    date: data.date || new Date().toISOString().slice(0, 10),
    rates,
  }
}
