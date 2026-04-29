const DEFAULT_API_BASE_URL = 'https://api.exchangerate.host/v1'

interface AppConfig {
  apiBaseUrl: string
  apiKey?: string
}

function normalizeBaseUrl(raw: string | undefined): string {
  const candidate = raw?.trim() || DEFAULT_API_BASE_URL
  return candidate.replace(/\/+$/, '')
}

function normalizeApiKey(raw: string | undefined): string | undefined {
  const candidate = raw?.trim()
  return candidate ? candidate : undefined
}

export const appConfig: AppConfig = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  apiKey: normalizeApiKey(import.meta.env.VITE_API_KEY),
}
