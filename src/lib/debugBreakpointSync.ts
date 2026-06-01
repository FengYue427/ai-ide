import type { DebugBreakpoint } from './debugBreakpoints'
import { buildCdpBreakpointAttempts, breakpointUrlPatternsForPath } from './debugBreakpointPatterns'

/** Escape a workspace-relative path for CDP `urlRegex` (Node inspect). */
export function breakpointUrlRegexForPath(filePath: string): string {
  return breakpointUrlPatternsForPath(filePath)[0] ?? `${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
}

export function enabledBreakpointsForFile(
  breakpoints: DebugBreakpoint[],
  path: string,
): DebugBreakpoint[] {
  return breakpoints.filter((bp) => bp.path === path && bp.enabled)
}

export interface CdpSetBreakpointParams {
  lineNumber: number
  urlRegex: string
}

/** Build CDP Debugger.setBreakpointByUrl params (0-based line). */
export function buildCdpBreakpointParams(
  breakpoint: DebugBreakpoint,
): CdpSetBreakpointParams {
  const attempt = buildCdpBreakpointAttempts(breakpoint)[0]
  return attempt ?? {
    lineNumber: Math.max(0, breakpoint.line - 1),
    urlRegex: breakpointUrlRegexForPath(breakpoint.path),
  }
}

export function countEnabledBreakpoints(breakpoints: DebugBreakpoint[]): number {
  return breakpoints.filter((bp) => bp.enabled).length
}
