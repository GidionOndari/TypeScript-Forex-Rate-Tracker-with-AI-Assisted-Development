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
