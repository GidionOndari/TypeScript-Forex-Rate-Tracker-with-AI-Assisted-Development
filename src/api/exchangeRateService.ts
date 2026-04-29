import { appConfig } from '../config'
import type { ExchangeRatesResponse } from '../types'
import { RequestTimeoutError, request } from '../utils'

interface ApiErrorPayload {
  success?: false
  error?: {
    code?: number | string
    type?: string
    info?: string
  }
  message?: string
}

interface NormalizedExchangeRatePayload {
  base: string
  date: string
  rates: Record<string, number>
}

/**
 * Fetches the latest exchange rates for a provided base currency.
 */
export async function getLatestRates(baseCurrency: string): Promise<ExchangeRatesResponse> {
  const normalizedBase = baseCurrency.trim().toUpperCase()

  if (!normalizedBase) {
    throw new Error('Base currency is required.')
  }

  const params = new URLSearchParams({ base: normalizedBase })

  if (appConfig.apiKey) {
    params.set('access_key', appConfig.apiKey)
  }

  const url = `${appConfig.apiBaseUrl}/latest?${params.toString()}`

  let rawResponse: unknown

  try {
    rawResponse = await request(url)
  } catch (error) {
    if (error instanceof RequestTimeoutError) {
      throw new Error(`Request timeout: ${error.message}`)
    }

    throw new Error(`Failed to fetch exchange rates: ${toErrorMessage(error)}`)
  }

  console.debug('ExchangeRate API raw response:', rawResponse)

  const parsedResponse = parseExchangeRatePayload(rawResponse)

  if (parsedResponse.kind === 'error') {
    throw new Error(parsedResponse.message)
  }

  return parsedResponse.data
}

type ParseResult =
  | { kind: 'success'; data: ExchangeRatesResponse }
  | { kind: 'error'; message: string }

function parseExchangeRatePayload(payload: unknown): ParseResult {
  const normalizedPayload = normalizeExchangeRatePayload(payload)

  if (normalizedPayload && isExchangeRatesResponse(normalizedPayload)) {
    return { kind: 'success', data: normalizedPayload }
  }

  if (isApiErrorPayload(payload)) {
    return {
      kind: 'error',
      message: formatApiError(payload),
    }
  }

  return {
    kind: 'error',
    message:
      'Invalid API response schema: expected rates plus base/source and optional date/timestamp.',
  }
}

function normalizeExchangeRatePayload(payload: unknown): NormalizedExchangeRatePayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as {
    base?: unknown
    source?: unknown
    date?: unknown
    timestamp?: unknown
    rates?: unknown
  }

  const rawBase = pickString(candidate.base) ?? pickString(candidate.source)

  if (!rawBase || !candidate.rates || typeof candidate.rates !== 'object') {
    return null
  }

  const rates = normalizeRates(candidate.rates)

  if (!rates) {
    return null
  }

  const date = normalizeDate(candidate.date, candidate.timestamp)

  return {
    base: rawBase.trim().toUpperCase(),
    date,
    rates,
  }
}

function normalizeRates(rawRates: unknown): Record<string, number> | null {
  if (!rawRates || typeof rawRates !== 'object') {
    return null
  }

  const normalizedRates: Record<string, number> = {}

  for (const [currencyCode, rawValue] of Object.entries(rawRates)) {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      normalizedRates[currencyCode] = rawValue
      continue
    }

    if (typeof rawValue === 'string') {
      const parsed = Number(rawValue)

      if (Number.isFinite(parsed)) {
        normalizedRates[currencyCode] = parsed
        continue
      }
    }

    return null
  }

  return normalizedRates
}

function normalizeDate(rawDate: unknown, rawTimestamp: unknown): string {
  const dateString = pickString(rawDate)

  if (dateString) {
    return dateString
  }

  const timestamp = toTimestamp(rawTimestamp)

  if (timestamp !== null) {
    return new Date(timestamp * 1000).toISOString().slice(0, 10)
  }

  return new Date().toISOString().slice(0, 10)
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function isExchangeRatesResponse(value: unknown): value is ExchangeRatesResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ExchangeRatesResponse>

  return (
    typeof candidate.base === 'string' &&
    candidate.base.trim().length > 0 &&
    typeof candidate.date === 'string' &&
    candidate.date.trim().length > 0 &&
    typeof candidate.rates === 'object' &&
    candidate.rates !== null &&
    Object.values(candidate.rates).every((rate) => typeof rate === 'number' && Number.isFinite(rate))
  )
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as ApiErrorPayload

  return candidate.success === false || typeof candidate.message === 'string' || !!candidate.error
}

function formatApiError(payload: ApiErrorPayload): string {
  const code = payload.error?.code
  const type = payload.error?.type
  const info = payload.error?.info

  const parts = [
    'Exchange rate API returned an error.',
    code !== undefined ? `code=${String(code)}` : undefined,
    type ? `type=${type}` : undefined,
    info || payload.message,
  ].filter(Boolean)

  return parts.join(' ')
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown request failure.'
}
