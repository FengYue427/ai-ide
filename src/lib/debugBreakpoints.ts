export interface DebugBreakpoint {
  id: string
  path: string
  line: number
  enabled: boolean
}

const STORAGE_KEY = 'ai-ide:debug-breakpoints'

export function breakpointKey(path: string, line: number): string {
  return `${path}:${line}`
}

export function loadDebugBreakpoints(): DebugBreakpoint[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DebugBreakpoint[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveDebugBreakpoints(breakpoints: DebugBreakpoint[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(breakpoints))
}

export function toggleBreakpointInList(
  breakpoints: DebugBreakpoint[],
  path: string,
  line: number,
): DebugBreakpoint[] {
  const key = breakpointKey(path, line)
  const existing = breakpoints.find((bp) => bp.id === key)
  if (existing) {
    return breakpoints.filter((bp) => bp.id !== key)
  }
  return [...breakpoints, { id: key, path, line, enabled: true }]
}

export function setBreakpointEnabledInList(
  breakpoints: DebugBreakpoint[],
  path: string,
  line: number,
  enabled: boolean,
): DebugBreakpoint[] {
  const key = breakpointKey(path, line)
  const existing = breakpoints.find((bp) => bp.id === key)
  if (!existing) {
    if (!enabled) return breakpoints
    return [...breakpoints, { id: key, path, line, enabled: true }]
  }
  return breakpoints.map((bp) => (bp.id === key ? { ...bp, enabled } : bp))
}

export function breakpointsForFileDecorations(
  breakpoints: DebugBreakpoint[],
  path: string,
): DebugBreakpoint[] {
  return breakpoints.filter((bp) => bp.path === path)
}

export function breakpointsForFile(breakpoints: DebugBreakpoint[], path: string): DebugBreakpoint[] {
  return breakpoints.filter((bp) => bp.path === path && bp.enabled)
}
