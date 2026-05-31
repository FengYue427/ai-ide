import { parseDebugCallStack } from '../lib/debugCallStack'
import { fetchDebugLocals } from '../lib/debugLocals'
import type { DebugPauseInspection, DebugStackFrame, DebugLocalVariable } from '../types/debugInspect'
import type { DebugCdpClient } from './debugCdpClient'
import { parseCdpPausedLocation } from './debugCdpClient'

export async function buildDebugPauseInspection(
  client: DebugCdpClient,
  params: unknown,
): Promise<DebugPauseInspection | null> {
  const location = parseCdpPausedLocation(params)
  if (!location) return null

  const callStack = parseDebugCallStack(params)
  const scopeId = callStack[0]?.localScopeObjectId
  const locals = scopeId ? await fetchDebugLocals(client, scopeId) : []

  return { location, callStack, locals }
}

export async function inspectDebugStackFrame(
  client: DebugCdpClient | null,
  callStack: DebugStackFrame[],
  index: number,
): Promise<DebugPauseInspection | null> {
  const frame = callStack[index]
  if (!frame) return null

  let locals: DebugLocalVariable[] = []
  if (client && frame.localScopeObjectId) {
    locals = await fetchDebugLocals(client, frame.localScopeObjectId)
  }

  return {
    location: { path: frame.path, line: frame.line },
    callStack,
    locals,
  }
}
