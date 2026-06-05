/** v1.4.8 — orchestrator interface stub (no queue drainage). ADR D1. */

import { publishRuntimeEvent } from './runtimeEventBus'

export type RuntimeIntentKind = 'plan' | 'spec' | 'adhoc'
export type RuntimeIntentSource = 'chat' | 'palette' | 'plan-map' | 'hook'

export interface RuntimeIntentBackfill {
  taskPath: string
  taskText: string
  specAcceptancePath?: string
}

export interface RuntimeIntent {
  kind: RuntimeIntentKind
  targetPath: string
  prompt: string
  backfill?: RuntimeIntentBackfill
  source?: RuntimeIntentSource
}

export type OrchestratorMode = 'stub'

export interface OrchestratorEnqueueResult {
  accepted: boolean
  mode: OrchestratorMode
  intentId: string
}

let intentCounter = 0

export function getOrchestratorMode(): OrchestratorMode {
  return 'stub'
}

/** Stub: records intent on event bus only — does not write ideStore queue. */
export function enqueueRuntimeIntent(intent: RuntimeIntent): OrchestratorEnqueueResult {
  intentCounter += 1
  const intentId = `stub-intent-${intentCounter}`

  publishRuntimeEvent({
    type: 'queue.progress',
    at: new Date().toISOString(),
    message: `[stub] enqueue ${intent.kind}: ${intent.targetPath}`,
    meta: {
      intentId,
      source: intent.source ?? 'unknown',
      kind: intent.kind,
    },
  })

  return { accepted: true, mode: 'stub', intentId }
}
