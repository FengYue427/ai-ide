export type TabCompletionPath = 'cache' | 'fim' | 'platform' | 'chat'

export type TabCompletionFailureReason = 'empty' | 'timeout' | 'http413' | 'error' | 'unknown'

export interface TabCompletionMetricsSnapshot {
  cacheHits: number
  cacheMisses: number
  skipped: number
  fimSuccess: number
  platformSuccess: number
  chatSuccess: number
  failures: number
  lastFailureReason: TabCompletionFailureReason | null
  lastPath: TabCompletionPath | null
  lastLatencyMs: number | null
  avgLatencyMs: number | null
}

const state = {
  cacheHits: 0,
  cacheMisses: 0,
  skipped: 0,
  fimSuccess: 0,
  platformSuccess: 0,
  chatSuccess: 0,
  failures: 0,
  lastFailureReason: null as TabCompletionFailureReason | null,
  lastPath: null as TabCompletionPath | null,
  lastLatencyMs: null as number | null,
  latencyTotalMs: 0,
  latencySamples: 0,
}

export function recordTabCompletionSkipped(): void {
  state.skipped += 1
}

export function classifyTabCompletionFailure(error: unknown): TabCompletionFailureReason {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()
  if (lower.includes('413') || lower.includes('payload too large')) return 'http413'
  if (lower.includes('timeout') || lower.includes('aborted')) return 'timeout'
  if (lower.includes('empty') || lower.includes('no completion')) return 'empty'
  return 'error'
}

export function recordTabCompletionCacheHit(): void {
  state.cacheHits += 1
  state.lastPath = 'cache'
  state.lastLatencyMs = 0
}

export function recordTabCompletionRequestStart(): void {
  state.cacheMisses += 1
}

export function recordTabCompletionSuccess(path: TabCompletionPath, latencyMs: number): void {
  state.lastPath = path
  state.lastLatencyMs = latencyMs
  state.latencyTotalMs += latencyMs
  state.latencySamples += 1
  if (path === 'fim') state.fimSuccess += 1
  else if (path === 'platform') state.platformSuccess += 1
  else if (path === 'chat') state.chatSuccess += 1
}

export function recordTabCompletionFailure(reason: TabCompletionFailureReason = 'unknown'): void {
  state.failures += 1
  state.lastFailureReason = reason
}

export function getTabCompletionMetrics(): TabCompletionMetricsSnapshot {
  const avgLatencyMs =
    state.latencySamples > 0 ? Math.round(state.latencyTotalMs / state.latencySamples) : null
  return {
    cacheHits: state.cacheHits,
    cacheMisses: state.cacheMisses,
    skipped: state.skipped,
    fimSuccess: state.fimSuccess,
    platformSuccess: state.platformSuccess,
    chatSuccess: state.chatSuccess,
    failures: state.failures,
    lastFailureReason: state.lastFailureReason,
    lastPath: state.lastPath,
    lastLatencyMs: state.lastLatencyMs,
    avgLatencyMs,
  }
}

export function resetTabCompletionMetrics(): void {
  state.cacheHits = 0
  state.cacheMisses = 0
  state.skipped = 0
  state.fimSuccess = 0
  state.platformSuccess = 0
  state.chatSuccess = 0
  state.failures = 0
  state.lastFailureReason = null
  state.lastPath = null
  state.lastLatencyMs = null
  state.latencyTotalMs = 0
  state.latencySamples = 0
}
