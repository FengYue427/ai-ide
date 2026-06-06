/** v1.5 F6 — persist runtime-state.json into workspace files. */

import {
  RUNTIME_STATE_PATH,
  type RuntimeHookResult,
  type RuntimeQueueSnapshot,
  type RuntimeStateDocument,
} from './runtimeState'

export interface RuntimeStateWriteInput {
  activeSpecPath?: string | null
  queueSnapshot?: RuntimeQueueSnapshot
  hookResults?: RuntimeHookResult[]
}

export function buildRuntimeStateDocument(input: RuntimeStateWriteInput): RuntimeStateDocument {
  const lastHookResults = input.hookResults?.slice(-10)
  return {
    version: 1,
    activeSpecPath: input.activeSpecPath ?? undefined,
    queueSnapshot: input.queueSnapshot,
    lastHookResults: lastHookResults && lastHookResults.length > 0 ? lastHookResults : undefined,
    updatedAt: new Date().toISOString(),
  }
}

export function serializeRuntimeStateDocument(document: RuntimeStateDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`
}

export function upsertRuntimeStateInFiles<T extends { name: string; content: string; language?: string }>(
  files: T[],
  input: RuntimeStateWriteInput,
): T[] {
  const document = buildRuntimeStateDocument(input)
  const content = serializeRuntimeStateDocument(document)
  const next = [...files]
  const index = next.findIndex((file) => file.name === RUNTIME_STATE_PATH)
  const row = { name: RUNTIME_STATE_PATH, content, language: 'json' as const }
  if (index >= 0) {
    next[index] = { ...next[index], ...row }
  } else {
    next.push(row as T)
  }
  return next
}

export function hookResultsFromOutcomes(
  outcomes: Array<{ hookId: string; status: RuntimeHookResult['status'] }>,
  specPath?: string,
): RuntimeHookResult[] {
  const at = new Date().toISOString()
  return outcomes.map((outcome) => ({
    hookId: outcome.hookId,
    at,
    status: outcome.status,
    ...(specPath ? { specPath } : {}),
  }))
}
