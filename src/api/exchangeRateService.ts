/**
 * Exchange-rate service module.
 *
 * Purpose: provide app-facing Forex API operations and normalize third-party
 * payloads into stable domain shapes consumed by UI/state layers.
 */
import { appConfig } from '../config'
import { toExchangeRateNumber, type ExchangeRatesResponse } from '../types'
import { request } from '../utils'
/**
 * Fetches latest exchange rates for the provided base currency.
 *
 * Flow:
 * 1) Sanitize the caller-provided base code.
 * 2) Request `/latest` from the configured API origin.
 * 3) Keep only numerically valid rates to protect downstream UI calculations.
 *
 * Edge cases:
 * - Empty/whitespace base code throws early.
 * - Missing `rates` payload is treated as a protocol error.
 * - Invalid numeric fields are skipped instead of crashing the render path.
 *
 * @param baseCurrency - ISO 4217 code (for example `USD`).
 * @returns Normalized response containing base, date, and validated numeric rates.
 * @throws {Error} When base currency is empty.
 * @throws {Error} When API payload is missing a `rates` object.
 * @throws {Error} When the underlying request utility fails (network/timeout/HTTP errors).
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
