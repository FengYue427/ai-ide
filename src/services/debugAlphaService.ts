/** v1.1.7 Alpha — Node inspect attach helpers (WebContainer). */

export const DEBUG_INSPECT_PORT = 9229

const INSPECT_URL_RE = /ws:\/\/[^\s]+/i
const DEBUGGER_LISTENING_RE = /Debugger listening on/i

export type DebugAttachPhase =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'attached'
  | 'running'
  | 'paused'
  | 'ended'
  | 'failed'

export type DebugSyncMode = 'cdp' | 'injected'

export type DebugRuntimeKind = 'webcontainer' | 'desktop'

export interface DebugAttachResult {
  phase: DebugAttachPhase
  inspectUrl: string | null
  exitCode?: number
  error?: string
}

export function parseInspectUrlFromOutput(chunk: string): string | null {
  const match = chunk.match(INSPECT_URL_RE)
  return match?.[0] ?? null
}

export function outputIndicatesDebuggerListening(chunk: string): boolean {
  return DEBUGGER_LISTENING_RE.test(chunk) || Boolean(parseInspectUrlFromOutput(chunk))
}

/** Spawn args for `node --inspect-brk` (Alpha). */
export function nodeInspectBrkArgs(fileName: string, port = DEBUG_INSPECT_PORT): string[] {
  return [`--inspect-brk=0.0.0.0:${port}`, fileName]
}
