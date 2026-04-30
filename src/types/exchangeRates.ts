/**
 * ExchangeRate.host latest endpoint response payload.
 * Example source: /latest?base=USD
 */
export interface ExchangeRatesResponse {
  /**
   * Base currency code used to calculate all conversion rates (for example, "USD").
   */
  base: string

  /**
   * ISO date string representing when the rates were published (YYYY-MM-DD).
   */
  date: string

  /**
   * Currency-rate map keyed by ISO currency code (for example, "EUR", "JPY").
   * Each value is the numeric conversion rate relative to `base`.
   */
  rates: Record<string, number>
}

export function toExchangeRateNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  if (trimmedValue.length === 0) {
    return null
  }

  const parsedValue = Number(trimmedValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

export function isExchangeRatesResponse(value: unknown): value is ExchangeRatesResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ExchangeRatesResponse> & { rates?: Record<string, unknown> }

  if (typeof candidate.base !== 'string' || candidate.base.trim().length === 0) {
    return false
  }

  if (typeof candidate.date !== 'string' || candidate.date.trim().length === 0) {
    return false
  }

  if (!candidate.rates || typeof candidate.rates !== 'object') {
    return false
  }

  return Object.values(candidate.rates).every((rate) => toExchangeRateNumber(rate) !== null)
}
