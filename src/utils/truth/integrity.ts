export function isValidCurrencyCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value)
}

export function hasCompleteNumericRates(rates: unknown): rates is Record<string, number> {
  if (!rates || typeof rates !== 'object') {
    return false
  }

  const entries = Object.entries(rates)
  if (entries.length === 0) {
    return false
  }

  return entries.every(([currency, value]) => isValidCurrencyCode(currency) && typeof value === 'number' && Number.isFinite(value))
}
