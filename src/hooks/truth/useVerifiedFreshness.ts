import { toVerifiedFreshness, type FreshnessContract } from '../../adapters/truth/freshnessAdapter'
import type { VerifiedViewModel } from '../../utils/truth/types'

export function useVerifiedFreshness(contract: unknown): VerifiedViewModel<FreshnessContract> {
  return toVerifiedFreshness(contract)
}
