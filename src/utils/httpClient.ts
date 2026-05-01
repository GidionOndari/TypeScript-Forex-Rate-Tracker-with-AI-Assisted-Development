/**
 * HTTP transport utility module.
 *
 * Purpose: centralize outbound request behavior (timeout, retry policy,
 * JSON parsing, and error normalization) for all service-layer API calls.
 */
/**
 * Minimal HTTP utility for JSON GET requests.
 * Returns parsed data or throws a meaningful error.
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 7000
const MAX_RETRY_ATTEMPTS = 2
const INITIAL_BACKOFF_MS = 500

export class RequestTimeoutError extends Error {
  /** Error used to distinguish timeout failures from other network failures. */
  constructor(message = 'Request timed out') {
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

/**
 * Performs a resilient JSON GET request.
 *
 * Why retries: short-lived network failures and 5xx responses are often transient.
 * Retries are bounded and exponential to avoid hammering the API.
 *
 * @param url - Absolute endpoint URL to fetch.
 * @param timeoutMs - Timeout budget in milliseconds per attempt.
 * @returns Parsed JSON payload.
 * @throws {RequestTimeoutError} When a request attempt exceeds `timeoutMs` and retries are exhausted.
 * @throws {Error} For normalized network failures, non-2xx HTTP statuses after retry budget, or invalid JSON.
 */
export async function request(url: string, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS): Promise<any> {
  let retryAttempt = 0

  while (true) {
    try {
      const response = await fetchWithTimeout(url, timeoutMs)

      if (!response.ok) {
        throw new HttpStatusError(response.status, response.statusText)
      }

      try {
        const rawResponseBody = await response.text()
        const parsedResponse = JSON.parse(rawResponseBody)
        return parsedResponse
      } catch (error) {
        throw new Error('Invalid response format: expected JSON.')
      }
    } catch (error) {
      if (!shouldRetry(error) || retryAttempt >= MAX_RETRY_ATTEMPTS) {
        throw normalizeRequestError(error)
      }

      retryAttempt += 1
      // Exponential backoff reduces pressure during transient upstream instability.
      const backoffMs = INITIAL_BACKOFF_MS * 2 ** (retryAttempt - 1)

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
    const response = await fetch(url, { signal: controller.signal })
    return response
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      throw new RequestTimeoutError()
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Retries only transient failures:
 * - browser/network TypeError
 * - upstream 5xx HTTP status
 */
function shouldRetry(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true
  }

  if (error instanceof HttpStatusError) {
    return error.status >= 500 && error.status <= 599
  }

  return false
}

/** Maps low-level failures to stable, user-facing error messages. */
function normalizeRequestError(error: unknown): Error {
  if (error instanceof RequestTimeoutError) {
    return error
  }

  if (error instanceof HttpStatusError) {
    return error
  }

  if (error instanceof TypeError) {
    return new Error('Network error: unable to complete request.')
  }

  return error instanceof Error ? error : new Error('Unknown request failure.')
}

/**
 * Async backoff helper.
 * Extracted for readability and to keep retry loop intention explicit.
 */
async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}
