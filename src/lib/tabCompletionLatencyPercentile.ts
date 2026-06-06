/** v1.4 F1 — percentile helpers for Tab/FIM latency samples. */

import { isTabPlusPlusPocEnabled, TAB_PLUS_PLUS_POC_P95_TARGET_MS } from './tabPlusPlusPoc'
import {
  isTabPlusPlusProductionEnabled,
  TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS,
} from './v15Features'

export const TAB_COMPLETION_P95_TARGET_MS = 800

export function getTabCompletionP95TargetMs(): number {
  if (isTabPlusPlusProductionEnabled()) return TAB_PLUS_PLUS_PRODUCTION_P95_TARGET_MS
  if (isTabPlusPlusPocEnabled()) return TAB_PLUS_PLUS_POC_P95_TARGET_MS
  return TAB_COMPLETION_P95_TARGET_MS
}

const MAX_LATENCY_SAMPLES = 200

const latencySamples: number[] = []

export function pushTabCompletionLatencySample(ms: number): void {
  if (!Number.isFinite(ms) || ms < 0) return
  latencySamples.push(Math.round(ms))
  if (latencySamples.length > MAX_LATENCY_SAMPLES) {
    latencySamples.shift()
  }
}

export function getTabCompletionLatencySamples(): readonly number[] {
  return latencySamples
}

export function clearTabCompletionLatencySamples(): void {
  latencySamples.length = 0
}

/** Nearest-rank percentile on a sorted copy (p in 0–100). */
export function computeLatencyPercentile(samples: readonly number[], percentile: number): number | null {
  if (samples.length === 0) return null
  const sorted = [...samples].sort((a, b) => a - b)
  const rank = Math.ceil((percentile / 100) * sorted.length) - 1
  const index = Math.max(0, Math.min(sorted.length - 1, rank))
  return sorted[index] ?? null
}

export function isTabCompletionP95UnderTarget(
  p95Ms: number | null,
  targetMs = getTabCompletionP95TargetMs(),
): boolean | null {
  if (p95Ms == null) return null
  return p95Ms < targetMs
}
