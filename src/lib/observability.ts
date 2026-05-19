type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void

let reporter: ErrorReporter | null = null

/** Optional hook for Sentry or other providers (see docs/OBSERVABILITY.md). */
export function setErrorReporter(fn: ErrorReporter | null): void {
  reporter = fn
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[AI IDE]', error, context ?? '')
  reporter?.(error, context)
}

export function initObservability(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, { source: 'window.error' })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { source: 'unhandledrejection' })
  })
}
