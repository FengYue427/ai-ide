import type { DebugStackFrame } from '../types/debugInspect'

function fileNameFromUrl(url: string): string {
  const normalized = url.replace(/^file:\/\//, '')
  return normalized.split(/[/\\]/).pop() ?? normalized
}

function localScopeObjectId(scopeChain: unknown): string | undefined {
  if (!Array.isArray(scopeChain)) return undefined
  const local = scopeChain.find(
    (scope) =>
      scope &&
      typeof scope === 'object' &&
      (scope as { type?: string }).type === 'local',
  ) as { object?: { objectId?: string } } | undefined
  const fallback = scopeChain[0] as { object?: { objectId?: string } } | undefined
  return local?.object?.objectId ?? fallback?.object?.objectId
}

/** Parse CDP `Debugger.paused` call frames (v1.1.7 F3). */
export function parseDebugCallStack(params: unknown): DebugStackFrame[] {
  if (!params || typeof params !== 'object') return []
  const callFrames = (params as { callFrames?: unknown }).callFrames
  if (!Array.isArray(callFrames)) return []

  return callFrames.map((frame, index) => {
    const record = frame as {
      callFrameId?: string
      functionName?: string
      url?: string
      lineNumber?: number
      columnNumber?: number
      scopeChain?: unknown
    }
    const path = fileNameFromUrl(typeof record.url === 'string' ? record.url : '')
    const line = typeof record.lineNumber === 'number' ? record.lineNumber + 1 : 1
    const column = typeof record.columnNumber === 'number' ? record.columnNumber + 1 : 1

    return {
      id: record.callFrameId ?? `frame-${index}`,
      functionName: record.functionName?.trim() || '(anonymous)',
      path,
      line,
      column,
      localScopeObjectId: localScopeObjectId(record.scopeChain),
    }
  })
}
