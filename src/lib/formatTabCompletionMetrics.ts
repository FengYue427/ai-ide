import type { TabCompletionFailureReason, TabCompletionMetricsSnapshot } from './inlineCompletionMetrics'

type MetricsTranslate = (
  key:
    | 'settings.tabCompletion.metricsDesc'
    | 'settings.tabCompletion.metricsFailures'
    | 'settings.tabCompletion.failureReason.empty'
    | 'settings.tabCompletion.failureReason.timeout'
    | 'settings.tabCompletion.failureReason.http413'
    | 'settings.tabCompletion.failureReason.error'
    | 'settings.tabCompletion.failureReason.unknown',
  params?: Record<string, string | number>,
) => string

export function formatTabCompletionFailureReason(
  t: MetricsTranslate,
  reason: TabCompletionFailureReason | null,
): string {
  if (!reason) return t('settings.tabCompletion.failureReason.unknown')
  switch (reason) {
    case 'empty':
      return t('settings.tabCompletion.failureReason.empty')
    case 'timeout':
      return t('settings.tabCompletion.failureReason.timeout')
    case 'http413':
      return t('settings.tabCompletion.failureReason.http413')
    case 'error':
      return t('settings.tabCompletion.failureReason.error')
    default:
      return t('settings.tabCompletion.failureReason.unknown')
  }
}

export function formatTabCompletionMetricsLine(
  t: MetricsTranslate,
  metrics: TabCompletionMetricsSnapshot,
): string {
  const line = t('settings.tabCompletion.metricsDesc', {
    hits: String(metrics.cacheHits),
    misses: String(metrics.cacheMisses),
    skipped: String(metrics.skipped),
    fim: String(metrics.fimSuccess),
    fimAttempts: String(metrics.fimAttempts),
    fimFallback: String(metrics.fimFallbackToChat),
    platform: String(metrics.platformSuccess),
    chat: String(metrics.chatSuccess),
    avgMs: metrics.avgLatencyMs != null ? String(metrics.avgLatencyMs) : '—',
    last: metrics.lastPath ?? '—',
  })

  if (metrics.failures <= 0) return line

  return `${line} · ${t('settings.tabCompletion.metricsFailures', {
    count: String(metrics.failures),
    reason: formatTabCompletionFailureReason(t, metrics.lastFailureReason),
  })}`
}
