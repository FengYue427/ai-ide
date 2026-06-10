import { buildApiUrl, getApiBaseUrl } from '../services/apiUtils'
import { isDesktopApp } from '../services/desktopBridge'
import { needsCrossOriginAuth } from './desktopAuthToken'

export const DESKTOP_SHELL_RETURN_PARAM = 'desktop_shell'
export const DESKTOP_SHELL_RETURN_FLAG = 'ai-ide:desktop-shell-return'

export type DesktopShellReturnKind = 'oauth' | 'billing'

/** Resolve relative API paths to absolute URLs when a remote API base is configured. */
export function resolveAppUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/')) return buildApiUrl(path)
  return path
}

export const E2E_DESKTOP_SHELL_KEY = 'ai-ide:e2e-desktop-shell'

function isE2eDesktopShellMock(): boolean {
  try {
    return localStorage.getItem(E2E_DESKTOP_SHELL_KEY) === '1'
  } catch {
    return false
  }
}

export function wantsDesktopShellReturn(): boolean {
  if (isE2eDesktopShellMock()) return true
  return isDesktopApp() && needsCrossOriginAuth()
}

export function appendDesktopCheckoutFields<T extends Record<string, unknown>>(body: T): T & { desktopShell?: boolean } {
  if (!wantsDesktopShellReturn()) return body
  return { ...body, desktopShell: true }
}

export function shouldReturnToDesktopShell(searchParams: URLSearchParams): boolean {
  return searchParams.get(DESKTOP_SHELL_RETURN_PARAM) === '1' && wantsDesktopShellReturn()
}

export function markDesktopShellReturn(kind: DesktopShellReturnKind): void {
  sessionStorage.setItem(DESKTOP_SHELL_RETURN_FLAG, kind)
}

/** OAuth callback on API origin — includes flags for Electron local-dist return. */
export function buildOAuthCallbackUrl(): string {
  const base = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '')
  const params = new URLSearchParams({ oauth_sync: '1' })
  if (wantsDesktopShellReturn()) {
    params.set(DESKTOP_SHELL_RETURN_PARAM, '1')
  }
  return `${base.replace(/\/$/, '')}/?${params.toString()}`
}

/**
 * Open an external http(s) URL. On desktop cross-origin shell, prefer system browser
 * so payment/OAuth providers are not blocked by file:// restrictions.
 */
export async function navigateToExternalUrl(url: string): Promise<void> {
  const target = resolveAppUrl(url)
  if (isDesktopApp() && needsCrossOriginAuth() && /^https?:\/\//i.test(target)) {
    const api = window.aiIdeDesktop
    if (api?.openExternal) {
      await api.openExternal(target)
      return
    }
  }
  window.location.href = target
}

/** OAuth: external browser on desktop cross-origin; in-window otherwise. */
export async function navigateToOAuthSignIn(provider: 'github' | 'google'): Promise<void> {
  const callbackUrl = encodeURIComponent(buildOAuthCallbackUrl())
  const url = `${buildApiUrl(`/api/auth/oauth/signin/${provider}`)}?callbackUrl=${callbackUrl}`
  if (wantsDesktopShellReturn()) {
    await navigateToExternalUrl(url)
    return
  }
  window.location.href = url
}

export async function returnToLocalDesktopShell(): Promise<boolean> {
  const api = window.aiIdeDesktop
  if (!api?.reloadLocalShell) return false
  const result = await api.reloadLocalShell()
  return Boolean(result?.ok)
}

/** @deprecated use markDesktopShellReturn('oauth') */
export const DESKTOP_OAUTH_RETURN_FLAG = DESKTOP_SHELL_RETURN_FLAG
