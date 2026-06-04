export type TabCompletionPath = 'cache' | 'fim' | 'platform' | 'chat'

export interface TabCompletionMetricsSnapshot {
  cacheHits: number
  cacheMisses: number
  fimSuccess: number
  platformSuccess: number
  chatSuccess: number
  failures: number
  lastPath: TabCompletionPath | null
  lastLatencyMs: number | null
  avgLatencyMs: number | null
}

const state = {
  cacheHits: 0,
  cacheMisses: 0,
  fimSuccess: 0,
  platformSuccess: 0,
  chatSuccess: 0,
  failures: 0,
  lastPath: null as TabCompletionPath | null,
  lastLatencyMs: null as number | null,
  latencyTotalMs: 0,
  latencySamples: 0,
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

export function recordTabCompletionFailure(): void {
  state.failures += 1
}

export function getTabCompletionMetrics(): TabCompletionMetricsSnapshot {
  const avgLatencyMs =
    state.latencySamples > 0 ? Math.round(state.latencyTotalMs / state.latencySamples) : null
  return {
    cacheHits: state.cacheHits,
    cacheMisses: state.cacheMisses,
    fimSuccess: state.fimSuccess,
    platformSuccess: state.platformSuccess,
    chatSuccess: state.chatSuccess,
    failures: state.failures,
    lastPath: state.lastPath,
    lastLatencyMs: state.lastLatencyMs,
    avgLatencyMs,
  }
}

export function resetTabCompletionMetrics(): void {
  state.cacheHits = 0
  state.cacheMisses = 0
  state.fimSuccess = 0
  state.platformSuccess = 0
  state.chatSuccess = 0
  state.failures = 0
  state.lastPath = null
  state.lastLatencyMs = null
  state.latencyTotalMs = 0
  state.latencySamples = 0
}
