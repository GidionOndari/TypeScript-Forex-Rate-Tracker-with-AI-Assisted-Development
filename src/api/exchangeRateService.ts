import { appConfig } from '../config'
import { isExchangeRatesResponse, toExchangeRateNumber, type ExchangeRatesResponse } from '../types'
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

  if (appConfig.apiKey && shouldAppendAccessKey(appConfig.apiBaseUrl)) {
    params.set('access_key', appConfig.apiKey)
  }

  const normalizedApiBaseUrl = normalizeApiBaseUrl(appConfig.apiBaseUrl)
  const url = `${normalizedApiBaseUrl}/latest?${params.toString()}`
  console.debug('[exchangeRateService] request URL', { url, baseCurrency: normalizedBase })

  let rawResponse: unknown

  try {
    rawResponse = await request(url)
  } catch (error) {
    console.error('[exchangeRateService] request error', {
      url,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    })
    if (error instanceof RequestTimeoutError) {
      throw new Error(`Request timeout: ${error.message}`)
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error(toErrorMessage(error))
  }

  console.debug('ExchangeRate API raw response:', rawResponse)

  const parsedResponse = parseExchangeRatePayload(rawResponse)
  console.debug('[exchangeRateService] parsed result', parsedResponse)

  if (parsedResponse.kind === 'error') {
    console.error('[exchangeRateService] parsed response error', {
      message: parsedResponse.message,
      url,
    })
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
      'Invalid API response schema: expected base/source, rates (or quotes/data.rates), and optional date/timestamp.',
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
    quotes?: unknown
    data?: unknown
  }

  const rawBase = pickString(candidate.base) ?? pickString(candidate.source)

  if (!rawBase) {
    return null
  }

  const rawRates = extractRawRates(candidate)

  if (!rawRates) {
    return null
  }

  const rates = normalizeRates(rawRates, rawBase)

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

function normalizeRates(rawRates: unknown, baseCurrency: string): Record<string, number> | null {
  if (!rawRates || typeof rawRates !== 'object') {
    return null
  }

  const normalizedRates: Record<string, number> = {}

  for (const [currencyCode, rawValue] of Object.entries(rawRates)) {
    const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode, baseCurrency)

    if (!normalizedCurrencyCode) {
      return null
    }

    const normalizedRate = toFiniteRate(rawValue)

    if (normalizedRate !== null) {
      normalizedRates[normalizedCurrencyCode] = normalizedRate
      continue
    }

    return null
  }

  return normalizedRates
}

function extractRawRates(candidate: {
  rates?: unknown
  quotes?: unknown
  data?: unknown
}): unknown {
  if (candidate.rates && typeof candidate.rates === 'object') {
    return candidate.rates
  }

  if (candidate.quotes && typeof candidate.quotes === 'object') {
    return candidate.quotes
  }

  if (candidate.data && typeof candidate.data === 'object') {
    const nestedData = candidate.data as { rates?: unknown }

    if (nestedData.rates && typeof nestedData.rates === 'object') {
      return nestedData.rates
    }
  }

  return null
}

function normalizeCurrencyCode(rawCode: string, baseCurrency: string): string | null {
  const trimmedCode = rawCode.trim().toUpperCase()
  const normalizedBaseCurrency = baseCurrency.trim().toUpperCase()

  if (/^[A-Z]{3}$/.test(trimmedCode)) {
    return trimmedCode
  }

  if (/^[A-Z]{6}$/.test(trimmedCode) && trimmedCode.startsWith(normalizedBaseCurrency)) {
    return trimmedCode.slice(3)
  }

  return null
}

function toFiniteRate(value: unknown): number | null {
  return toExchangeRateNumber(value)
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

function shouldAppendAccessKey(apiBaseUrl: string): boolean {
  if (isExchangeRateHost(apiBaseUrl)) {
    return false
  }

  try {
    const { hostname } = new URL(apiBaseUrl)
    return !isExchangeRateHost(hostname)
  } catch {
    return true
  }
}

function isExchangeRateHost(value: string): boolean {
  return value.toLowerCase().includes('exchangerate.host')
}

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  const withoutTrailingSlash = apiBaseUrl.replace(/\/+$/, '')
  return withoutTrailingSlash.replace(/\/v1$/i, '')
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
