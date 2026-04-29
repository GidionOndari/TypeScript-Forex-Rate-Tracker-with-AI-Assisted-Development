import { appConfig } from '../config'
import type { ExchangeRatesResponse } from '../types'
import { request } from '../utils'

interface ApiErrorPayload {
  success?: false
  error?: {
    code?: number | string
    type?: string
    info?: string
  }
  message?: string
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
  if (isExchangeRatesResponse(payload)) {
    return { kind: 'success', data: payload }
  }

  if (isApiErrorPayload(payload)) {
    return {
      kind: 'error',
      message: formatApiError(payload),
    }
  }

  return {
    kind: 'error',
    message: 'Invalid API response schema: expected { base, date, rates }.',
  }
}

function isExchangeRatesResponse(value: unknown): value is ExchangeRatesResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ExchangeRatesResponse>

  return (
    typeof candidate.base === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.rates === 'object' &&
    candidate.rates !== null &&
    Object.values(candidate.rates).every((rate) => typeof rate === 'number')
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
