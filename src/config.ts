const DEFAULT_API_BASE_URL = 'https://api.frankfurter.app'

interface AppConfig {
  apiBaseUrl: string
}

function normalizeBaseUrl(raw: string | undefined): string {
  return (raw?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
}

export const appConfig: AppConfig = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
}
