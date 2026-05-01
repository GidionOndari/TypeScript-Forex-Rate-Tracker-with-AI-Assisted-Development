export type TrendDirection = 'up' | 'down' | 'stable' | 'new'

/**
 * Compares current and previous rate snapshots per currency.
 *
 * Edge cases:
 * - Missing/invalid prior values are marked as `new` to avoid false movement.
 * - Non-finite current values are treated as `new` so UI can degrade gracefully.
 */
export function calculateTrend(
  current: Record<string, number>,
  previous: Record<string, number> | null,
): Record<string, TrendDirection> {
  return Object.entries(current).reduce<Record<string, TrendDirection>>((acc, [currency, currentValue]) => {
    if (!Number.isFinite(currentValue)) {
      acc[currency] = 'new'
      return acc
    }

    if (!previous || typeof previous[currency] !== 'number' || !Number.isFinite(previous[currency])) {
      acc[currency] = 'new'
      return acc
    }

    const previousValue = previous[currency]

    if (currentValue > previousValue) {
      acc[currency] = 'up'
    } else if (currentValue < previousValue) {
      acc[currency] = 'down'
    } else {
      acc[currency] = 'stable'
    }

    return acc
  }, {})
}
