import { getApiBaseUrl } from '../services/apiUtils'

/** Public app origin shown in welcome / settings / share links. */
export function getPublicAppOrigin(): string | null {
  if (typeof window === 'undefined') return null

  const apiBase = getApiBaseUrl()?.replace(/\/$/, '')
  if (apiBase) return apiBase

  const origin = window.location.origin?.trim()
  if (!origin || origin === 'null' || origin.startsWith('file:')) return null
  return origin.replace(/\/$/, '')
}

/** Origin for room/share links — never returns file://. */
export function getShareableAppOrigin(): string | null {
  return getPublicAppOrigin()
}

/** Public folder asset (logo, favicon) — respects Vite `base` for file:// desktop builds. */
export function resolvePublicAsset(path: string): string {
  const name = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${name}`
}

export const APP_LOGO_ASSET = '/logo.svg'

export function resolveAppLogo(): string {
  return resolvePublicAsset(APP_LOGO_ASSET)
}

export function isCustomAppOrigin(origin: string): boolean {
  const host = new URL(origin).hostname.toLowerCase()
  return !host.endsWith('.vercel.app') && host !== 'localhost' && host !== '127.0.0.1'
}
