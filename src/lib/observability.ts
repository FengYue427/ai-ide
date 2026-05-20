type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void
type EventReporter = (name: string, context?: Record<string, unknown>) => void

let reporter: ErrorReporter | null = null
let eventReporter: EventReporter | null = null

const CLIENT_SESSION_KEY = 'ai-ide-client-session'

function getOrCreateClientSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    const existing = sessionStorage.getItem(CLIENT_SESSION_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `cs-${Date.now()}`
    sessionStorage.setItem(CLIENT_SESSION_KEY, id)
    return id
  } catch {
    return `cs-${Date.now()}`
  }
}

/** Optional hook for Sentry or other providers (see docs/OBSERVABILITY.md). */
export function setErrorReporter(fn: ErrorReporter | null): void {
  reporter = fn
}

export function setEventReporter(fn: EventReporter | null): void {
  eventReporter = fn
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const payload = {
    clientSessionId: getOrCreateClientSessionId(),
    ...context,
  }
  console.error('[AI IDE]', error, payload)
  reporter?.(error, payload)
}

export function trackEvent(name: string, context?: Record<string, unknown>): void {
  const payload = {
    clientSessionId: getOrCreateClientSessionId(),
    ...context,
  }
  if (import.meta.env.DEV) {
    console.info('[AI IDE event]', name, payload)
  }
  eventReporter?.(name, payload)
}

export function initObservability(): void {
  if (typeof window === 'undefined') return

  getOrCreateClientSessionId()

  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, { source: 'window.error' })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandledrejection' })
  })
}
