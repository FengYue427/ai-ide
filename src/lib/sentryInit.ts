import { setErrorReporter, setEventReporter } from './observability'

/** Optional Sentry wiring when VITE_SENTRY_DSN is set (requires @sentry/react). */
export async function initOptionalSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim()
  if (!dsn) return

  try {
    const Sentry = await import('@sentry/react')
    const release =
      (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() ||
      (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined)?.trim()

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: release ? `ai-ide@${release}` : undefined,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0.1,
    })

    setErrorReporter((error, context) => {
      Sentry.captureException(error, { extra: context })
    })

    setEventReporter((name, context) => {
      Sentry.addBreadcrumb({
        category: 'ai-ide',
        message: name,
        data: context,
        level: 'info',
      })
    })
  } catch (error) {
    console.warn(
      '[AI IDE] VITE_SENTRY_DSN is set but @sentry/react failed to load. Run: npm install @sentry/react',
      error,
    )
  }
}
