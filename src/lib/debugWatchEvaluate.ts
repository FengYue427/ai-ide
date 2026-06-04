import type { DebugCdpClient } from '../services/debugCdpClient'
import { MAX_DEBUG_WATCH_EXPRESSIONS } from './debugWatch'

export interface DebugWatchEvalResult {
  expression: string
  valuePreview: string
  error?: string
}

type CdpEvaluateResult = {
  result?: {
    value?: unknown
    description?: string
    type?: string
    unserializableValue?: string
  }
  exceptionDetails?: {
    text?: string
    exception?: { description?: string }
  }
}

export function formatCdpEvaluateValue(result: CdpEvaluateResult['result']): string {
  if (!result) return 'undefined'
  if (result.unserializableValue != null) return String(result.unserializableValue)
  if (result.description != null && result.description !== '') return result.description
  if (result.value !== undefined) {
    if (typeof result.value === 'string') return JSON.stringify(result.value)
    try {
      return JSON.stringify(result.value)
    } catch {
      return String(result.value)
    }
  }
  return result.type ?? 'undefined'
}

export async function evaluateDebugWatchExpression(
  client: DebugCdpClient,
  expression: string,
  callFrameId: string,
  timeoutMs = 2000,
): Promise<DebugWatchEvalResult> {
  const trimmed = expression.trim()
  if (!trimmed) {
    return { expression: trimmed, valuePreview: '' }
  }

  try {
    const response = await Promise.race([
      client.send<CdpEvaluateResult>('Runtime.evaluate', {
        expression: trimmed,
        callFrameId,
        returnByValue: true,
        silent: true,
      }),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('timeout')), timeoutMs)
      }),
    ])

    if (response.exceptionDetails) {
      const text =
        response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text ??
        'Evaluation failed'
      return { expression: trimmed, valuePreview: '', error: text }
    }

    return {
      expression: trimmed,
      valuePreview: formatCdpEvaluateValue(response.result),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evaluation failed'
    return { expression: trimmed, valuePreview: '', error: message }
  }
}

export async function evaluateDebugWatchExpressions(
  client: DebugCdpClient,
  expressions: string[],
  callFrameId: string,
): Promise<DebugWatchEvalResult[]> {
  const slots = expressions.slice(0, MAX_DEBUG_WATCH_EXPRESSIONS)
  const results: DebugWatchEvalResult[] = []
  for (let index = 0; index < MAX_DEBUG_WATCH_EXPRESSIONS; index += 1) {
    const expression = slots[index]?.trim() ?? ''
    if (!expression) {
      results.push({ expression: '', valuePreview: '' })
      continue
    }
    results.push(await evaluateDebugWatchExpression(client, expression, callFrameId))
  }
  return results
}
