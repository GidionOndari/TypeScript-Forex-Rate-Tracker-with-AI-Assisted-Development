/**
 * Minimal HTTP utility for JSON GET requests.
 * Returns parsed data or throws a meaningful error.
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 7000
const MAX_RETRY_ATTEMPTS = 2
const INITIAL_BACKOFF_MS = 500

export class RequestTimeoutError extends Error {
  constructor(message = 'Request timed out while fetching exchange rates.') {
    super(message)
    this.name = 'RequestTimeoutError'
  }
}

class HttpStatusError extends Error {
  readonly status: number

  constructor(status: number, statusText: string) {
    super(`HTTP error: ${status} ${statusText}`)
    this.name = 'HttpStatusError'
    this.status = status
  }
}

export async function request(url: string, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS): Promise<any> {
  let retryAttempt = 0

  while (true) {
    try {
      const response = await fetchWithTimeout(url, timeoutMs)

      if (!response.ok) {
        throw new HttpStatusError(response.status, response.statusText)
      }

      try {
        return await response.json()
      } catch {
        throw new Error('Invalid response format: expected JSON.')
      }
    } catch (error) {
      if (!shouldRetry(error) || retryAttempt >= MAX_RETRY_ATTEMPTS) {
        throw normalizeRequestError(error)
      }

      retryAttempt += 1
      const backoffMs = INITIAL_BACKOFF_MS * 2 ** (retryAttempt - 1)

      console.warn('[request] transient failure, retrying request', {
        attempt: retryAttempt,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        backoffMs,
        url,
        reason: toErrorMessage(error),
      })

      await delay(backoffMs)
    }
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(url, { signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RequestTimeoutError(`Request timed out after ${timeoutMs}ms while fetching exchange rates.`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true
  }

  if (error instanceof HttpStatusError) {
    return error.status >= 500 && error.status <= 599
  }

  return false
}

function normalizeRequestError(error: unknown): Error {
  if (error instanceof RequestTimeoutError) {
    return error
  }

  if (error instanceof HttpStatusError) {
    return new Error(error.message)
  }

  if (error instanceof TypeError) {
    return new Error('Network error: unable to complete request.')
  }

  return error instanceof Error ? error : new Error('Unknown request failure.')
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown request failure.'
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}
