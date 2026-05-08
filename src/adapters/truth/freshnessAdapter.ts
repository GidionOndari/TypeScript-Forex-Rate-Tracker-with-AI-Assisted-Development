import { isIsoDateString } from '../../utils/truth/freshness'
import type { VerifiedViewModel } from '../../utils/truth/types'

export interface FreshnessContract {
  asOf: string
  verificationStatus: 'verified' | 'unverified' | 'unavailable'
}

export function toVerifiedFreshness(contract: unknown): VerifiedViewModel<FreshnessContract> {
  if (!contract || typeof contract !== 'object') {
    return { state: 'unavailable', reason: 'Verification unavailable.' }
  }

  const candidate = contract as Partial<FreshnessContract>

  if (candidate.verificationStatus !== 'verified' && candidate.verificationStatus !== 'unverified' && candidate.verificationStatus !== 'unavailable') {
    return { state: 'unavailable', reason: 'Verification unavailable.' }
  }

  if (candidate.verificationStatus !== 'verified') {
    return { state: candidate.verificationStatus, reason: candidate.verificationStatus === 'unverified' ? 'Awaiting backend verification.' : 'Verification unavailable.' }
  }

  if (!isIsoDateString(candidate.asOf)) {
    return { state: 'unverified', reason: 'Awaiting backend verification.' }
  }

  return { state: 'verified', data: { asOf: candidate.asOf, verificationStatus: candidate.verificationStatus } }
}
