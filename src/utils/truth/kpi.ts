export function hasMinimumCoverage(rates: Record<string, number>, minimum = 3): boolean {
  return Object.keys(rates).length >= minimum
}
