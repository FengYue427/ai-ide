import type { TabCompletionFailureReason, TabCompletionMetricsSnapshot } from './inlineCompletionMetrics'

type MetricsTranslate = (
  key:
    | 'settings.tabCompletion.metricsDesc'
    | 'settings.tabCompletion.metricsFailures'
    | 'settings.tabCompletion.metricsP95'
    | 'settings.tabCompletion.metricsP95Unknown'
    | 'settings.tabCompletion.metricsP95Pass'
    | 'settings.tabCompletion.metricsP95Fail'
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

export function formatTabCompletionP95Line(t: MetricsTranslate, metrics: TabCompletionMetricsSnapshot): string {
  if (metrics.latencySampleCount === 0) {
    return t('settings.tabCompletion.metricsP95Unknown', { target: String(metrics.p95TargetMs) })
  }
  const p95Line = t('settings.tabCompletion.metricsP95', {
    p50: metrics.p50LatencyMs != null ? String(metrics.p50LatencyMs) : '—',
    p95: metrics.p95LatencyMs != null ? String(metrics.p95LatencyMs) : '—',
    samples: String(metrics.latencySampleCount),
    target: String(metrics.p95TargetMs),
  })
  if (metrics.p95UnderTarget == null) return p95Line
  const statusKey = metrics.p95UnderTarget
    ? 'settings.tabCompletion.metricsP95Pass'
    : 'settings.tabCompletion.metricsP95Fail'
  return `${p95Line} · ${t(statusKey)}`
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

  const p95Line = formatTabCompletionP95Line(t, metrics)
  const combined = `${line}\n${p95Line}`

  if (metrics.failures <= 0) return combined

  return `${combined} · ${t('settings.tabCompletion.metricsFailures', {
    count: String(metrics.failures),
    reason: formatTabCompletionFailureReason(t, metrics.lastFailureReason),
  })}`
}
