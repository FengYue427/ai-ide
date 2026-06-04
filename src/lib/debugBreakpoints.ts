export interface DebugBreakpoint {
  id: string
  path: string
  line: number
  enabled: boolean
  /** V8 condition for CDP `Debugger.setBreakpointByUrl` (v1.2.1 F2). */
  condition?: string
  /** Pause only after N hits at this line (client-side, v1.2.1 F2). */
  hitCount?: number
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

export function updateBreakpointMetaInList(
  breakpoints: DebugBreakpoint[],
  path: string,
  line: number,
  patch: { condition?: string; hitCount?: number | undefined },
): DebugBreakpoint[] {
  const key = breakpointKey(path, line)
  const existing = breakpoints.find((bp) => bp.id === key)
  if (!existing) return breakpoints

  return breakpoints.map((bp) => {
    if (bp.id !== key) return bp
    const next = { ...bp }
    if ('condition' in patch) {
      const trimmed = patch.condition?.trim()
      if (trimmed) next.condition = trimmed
      else delete next.condition
    }
    if ('hitCount' in patch) {
      if (patch.hitCount != null && patch.hitCount >= 2) next.hitCount = patch.hitCount
      else delete next.hitCount
    }
    return next
  })
}

export function breakpointHasAdvancedOptions(breakpoint: DebugBreakpoint): boolean {
  return Boolean(breakpoint.condition?.trim()) || (breakpoint.hitCount != null && breakpoint.hitCount >= 2)
}
