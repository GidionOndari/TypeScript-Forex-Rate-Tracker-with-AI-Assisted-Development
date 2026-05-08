import type { ExchangeRatesResponse } from '../../types'
import { isIsoDateString } from '../../utils/truth/freshness'
import { hasCompleteNumericRates, isValidCurrencyCode } from '../../utils/truth/integrity'
import { hasMinimumCoverage } from '../../utils/truth/kpi'
import type { VerifiedViewModel } from '../../utils/truth/types'

export interface RatesViewData {
  base: string
  date: string
  rates: Record<string, number>
}

export function toRatesViewModel(payload: unknown): VerifiedViewModel<RatesViewData> {
  if (!payload || typeof payload !== 'object') {
    return { state: 'unavailable', reason: 'Verification unavailable.' }
  }

  const candidate = payload as Partial<ExchangeRatesResponse>

  if (!isValidCurrencyCode(candidate.base) || !isIsoDateString(candidate.date)) {
    return { state: 'unverified', reason: 'Awaiting backend verification.' }
  }

  if (!hasCompleteNumericRates(candidate.rates) || !hasMinimumCoverage(candidate.rates)) {
    return { state: 'unverified', reason: 'Awaiting backend verification.' }
  }

  return {
    state: 'verified',
    data: {
      base: candidate.base,
      date: candidate.date,
      rates: candidate.rates,
    },
  }
}
