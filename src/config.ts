/**
 * Configuration module.
 *
 * Purpose: resolve runtime environment settings once and expose a stable
 * configuration object to service/infrastructure layers.
 */
const DEFAULT_API_BASE_URL = 'https://api.frankfurter.app'

/** Runtime configuration resolved from environment variables. */
interface AppConfig {
  apiBaseUrl: string
}

/**
 * Normalizes the raw API base URL.
 *
 * @param raw - Optional environment-provided API origin.
 * @returns URL origin without trailing slashes.
 */
function normalizeBaseUrl(raw: string | undefined): string {
  return (raw?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
}

/**
 * Application-wide configuration.
 * Falls back to Frankfurter when no custom base URL is provided.
 */
export const appConfig: AppConfig = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
}
