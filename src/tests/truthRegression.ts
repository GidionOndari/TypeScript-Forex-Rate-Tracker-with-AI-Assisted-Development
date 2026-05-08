import { toRatesViewModel } from '../adapters/truth/ratesViewModel'
import { toVerifiedFreshness } from '../adapters/truth/freshnessAdapter'

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

export function runTruthRegressionSuite(): void {
  const invalidTimestamp = toRatesViewModel({ base: 'USD', date: '', rates: { EUR: 1.1, GBP: 1.2, JPY: 150 } })
  assert(invalidTimestamp.state !== 'verified', 'invalid timestamps must fail closed')

  const missingMetrics = toRatesViewModel({ base: 'USD', date: '2026-05-08', rates: { EUR: 1.1 } })
  assert(missingMetrics.state !== 'verified', 'missing metrics must fail closed')

  const nanRate = toRatesViewModel({ base: 'USD', date: '2026-05-08', rates: { EUR: Number.NaN, GBP: 1.2, JPY: 100 } })
  assert(nanRate.state !== 'verified', 'NaN metrics must fail closed')

  const unavailableFreshness = toVerifiedFreshness({ asOf: '2026-05-08', verificationStatus: 'unavailable' })
  assert(unavailableFreshness.state === 'unavailable', 'missing freshness metadata must fail closed')

  const staleLikeContract = toVerifiedFreshness({ asOf: 'bad-date', verificationStatus: 'verified' })
  assert(staleLikeContract.state !== 'verified', 'invalid backend freshness contract must fail closed')
}
