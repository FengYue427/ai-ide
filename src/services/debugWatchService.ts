import { evaluateDebugWatchExpressions } from '../lib/debugWatchEvaluate'
import type { DebugWatchEvalResult } from '../lib/debugWatchEvaluate'
import type { DebugStackFrame } from '../types/debugInspect'
import { getActiveDebugClient } from './debugSessionService'

export async function refreshDebugWatchResults(
  expressions: string[],
  callStack: DebugStackFrame[],
  activeFrameIndex: number,
): Promise<DebugWatchEvalResult[]> {
  const client = getActiveDebugClient()
  const frame = callStack[activeFrameIndex]
  if (!client || !frame?.id) return []

  return evaluateDebugWatchExpressions(client, expressions, frame.id)
}
