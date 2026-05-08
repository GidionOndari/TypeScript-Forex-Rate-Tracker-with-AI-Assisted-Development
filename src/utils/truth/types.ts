export type VerifiedViewModel<T> =
  | { state: 'verified'; data: T }
  | { state: 'unverified'; reason: string }
  | { state: 'unavailable'; reason: string }

