import type { DesktopShellReturnKind } from './externalNavigation'
import { isDesktopApp } from '../services/desktopBridge'

export const DESKTOP_DEEP_LINK_SCHEME = 'ai-ide'
export const DESKTOP_DEEP_LINK_HOST = 'return'

export type DesktopDeepLinkKind = DesktopShellReturnKind

export type DesktopDeepLinkPayload = {
  kind: DesktopDeepLinkKind
  params: Record<string, string>
}

export function buildDesktopDeepLinkUrl(query: Record<string, string>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value)
  }
  return `${DESKTOP_DEEP_LINK_SCHEME}://${DESKTOP_DEEP_LINK_HOST}?${params.toString()}`
}

export function parseDesktopDeepLink(raw: string): DesktopDeepLinkPayload | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== `${DESKTOP_DEEP_LINK_SCHEME}:`) return null
    if (url.hostname !== DESKTOP_DEEP_LINK_HOST) return null
    const params: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      params[key] = value
    })
    const kind = params.kind === 'billing' ? 'billing' : 'oauth'
    return { kind, params }
  } catch {
    return null
  }
}

export function buildOAuthDesktopDeepLink(token?: string): string {
  const query: Record<string, string> = { kind: 'oauth' }
  if (token?.trim()) query.token = token.trim()
  return buildDesktopDeepLinkUrl(query)
}

export function buildBillingDesktopDeepLink(searchParams: URLSearchParams): string {
  const query: Record<string, string> = { kind: 'billing' }
  for (const key of ['subscription', 'plan'] as const) {
    const value = searchParams.get(key)
    if (value) query[key] = value
  }
  return buildDesktopDeepLinkUrl(query)
}

export function tryOpenDesktopDeepLink(url: string): void {
  window.location.href = url
}

export function triggerDesktopReturnFromBrowser(
  kind: DesktopDeepLinkKind,
  options?: { token?: string; searchParams?: URLSearchParams },
): void {
  if (isDesktopApp()) return
  const url =
    kind === 'billing'
      ? buildBillingDesktopDeepLink(options?.searchParams ?? new URLSearchParams(window.location.search))
      : buildOAuthDesktopDeepLink(options?.token)
  tryOpenDesktopDeepLink(url)
}

export const DESKTOP_RETURN_PENDING_KEY = 'ai-ide:desktop-return-pending'

export function markDesktopReturnPending(kind: DesktopDeepLinkKind): void {
  sessionStorage.setItem(DESKTOP_RETURN_PENDING_KEY, kind)
}

export function consumeDesktopReturnPending(): DesktopDeepLinkKind | null {
  const kind = sessionStorage.getItem(DESKTOP_RETURN_PENDING_KEY) as DesktopDeepLinkKind | null
  if (!kind) return null
  sessionStorage.removeItem(DESKTOP_RETURN_PENDING_KEY)
  return kind === 'billing' ? 'billing' : 'oauth'
}
