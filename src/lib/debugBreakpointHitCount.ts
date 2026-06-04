import type { DebugBreakpoint } from './debugBreakpoints'

export function findBreakpointsAtLocation(
  breakpoints: DebugBreakpoint[],
  path: string,
  line: number,
): DebugBreakpoint[] {
  return breakpoints.filter((bp) => bp.enabled && bp.path === path && bp.line === line)
}

/** Normalize hitCount: undefined or <2 means pause on every hit. */
export function effectiveHitCount(breakpoint: DebugBreakpoint): number {
  const n = breakpoint.hitCount
  if (n == null || !Number.isFinite(n) || n < 2) return 1
  return Math.floor(n)
}

/**
 * Record a pause at this breakpoint; return whether the UI should show paused state.
 * Client-side only (CDP does not implement hitCount).
 */
export function recordHitAndShouldPause(
  hitCounts: Map<string, number>,
  breakpoint: DebugBreakpoint,
): { shouldPause: boolean; hits: number } {
  const required = effectiveHitCount(breakpoint)
  const prev = hitCounts.get(breakpoint.id) ?? 0
  const hits = prev + 1
  hitCounts.set(breakpoint.id, hits)
  return { shouldPause: hits >= required, hits }
}

export function parseHitCountInput(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(n) || n < 1) return undefined
  return n
}

export function formatHitCountForInput(hitCount: number | undefined): string {
  if (hitCount == null || hitCount < 2) return ''
  return String(hitCount)
}
