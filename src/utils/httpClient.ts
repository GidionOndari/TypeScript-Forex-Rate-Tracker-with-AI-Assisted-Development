/**
 * Minimal HTTP utility for JSON GET requests.
 * Returns parsed data or throws a meaningful error.
 */
export async function request(url: string): Promise<any> {
  let response: Response

  try {
    response = await fetch(url)
  } catch {
    throw new Error('Network error: unable to complete request.')
  }

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error('Invalid response format: expected JSON.')
  }
}
