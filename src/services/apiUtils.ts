import { createTranslator } from '../i18n'
import { getApiLanguage } from '../lib/apiLanguage'

export function createClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `creq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function readJsonResponse<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export function getResponseRequestId(response: Response): string | null {
  return response.headers.get('x-request-id')?.trim() || null
}

let unauthorizedHandler: (() => void) | null = null
let apiErrorHandler: ((detail: { status: number; path: string }) => void) | null = null
let lastApiErrorToastAt = 0

export function setApiUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export function setApiErrorHandler(
  handler: ((detail: { status: number; path: string }) => void) | null,
): void {
  apiErrorHandler = handler
}

function requestPath(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.pathname
  return input.url
}

function shouldSurfaceApiError(path: string): boolean {
  return !path.includes('/api/auth/session') && !path.includes('/api/health')
}

function shouldNotifyUnauthorized(input: RequestInfo | URL): boolean {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return !raw.includes('/api/auth/session') && !raw.includes('/api/auth/signin')
}

/** User-facing message for fetch failures (offline, DNS, CORS). */
export function formatFetchError(error: unknown, fallback?: string): string {
  const t = createTranslator(getApiLanguage())
  const generic = fallback ?? t('network.error.generic')
  if (error instanceof TypeError && /fetch|network|Failed/i.test(error.message)) {
    return t('network.error.offline')
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return generic
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has('X-Request-Id')) {
    headers.set('X-Request-Id', createClientRequestId())
  }
  if (!headers.has('X-App-Language')) {
    headers.set('X-App-Language', getApiLanguage())
  }
  const path = requestPath(input)
  return fetch(input, { ...init, headers }).then((response) => {
    if (response.status === 401 && shouldNotifyUnauthorized(input)) {
      unauthorizedHandler?.()
    }
    if (response.status >= 500 && shouldSurfaceApiError(path)) {
      const now = Date.now()
      if (now - lastApiErrorToastAt > 4000) {
        lastApiErrorToastAt = now
        apiErrorHandler?.({ status: response.status, path })
      }
    }
    return response
  })
}
