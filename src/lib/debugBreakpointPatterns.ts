import type { DebugBreakpoint } from './debugBreakpoints'

/** Escape path segments for CDP `urlRegex` (v1.1.7.3). */
function escapeRegexSegment(segment: string): string {
  return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Candidate urlRegex patterns for Node file URLs (WebContainer + desktop). */
export function breakpointUrlPatternsForPath(filePath: string): string[] {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '')
  const escaped = escapeRegexSegment(normalized)
  const fileName = normalized.split('/').pop() ?? normalized
  const escapedName = escapeRegexSegment(fileName)

  const patterns = [
    `${escaped}$`,
    `[/\\\\]${escapedName}$`,
    escapedName === normalized ? `${escapedName}$` : null,
  ]

  return [...new Set(patterns.filter((value): value is string => Boolean(value)))]
}

export function buildCdpBreakpointAttempts(breakpoint: DebugBreakpoint): Array<{
  lineNumber: number
  urlRegex: string
}> {
  const patterns = breakpointUrlPatternsForPath(breakpoint.path)
  return patterns.map((urlRegex) => ({
    lineNumber: Math.max(0, breakpoint.line - 1),
    urlRegex,
  }))
}
