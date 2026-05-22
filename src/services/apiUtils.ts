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

export function setApiUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
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
  return fetch(input, { ...init, headers }).then((response) => {
    if (response.status === 401 && shouldNotifyUnauthorized(input)) {
      unauthorizedHandler?.()
    }
    return response
  })
}
