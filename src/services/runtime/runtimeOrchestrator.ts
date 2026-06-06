/** v1.5 F4 — orchestrator with optional production dual-write. */

import { isAideRuntimeProductionEnabled } from '../../lib/v15Features'
import { publishSpecQueueIntent } from './runtimeActivityPublishers'
import { publishRuntimeEvent } from './runtimeEventBus'
import { readHooksContentFromFiles, runHooksForEvent } from './hookRunner'
import { hookResultsFromOutcomes, upsertRuntimeStateInFiles } from './runtimeStateWriter'
import { specNameFromTasksPath } from './runtimeState'

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

export type OrchestratorMode = 'stub' | 'production'

export interface OrchestratorEnqueueResult {
  accepted: boolean
  mode: OrchestratorMode
  intentId: string
  pauseReason?: string
}

export interface SpecQueueWritePayload {
  prompt: string
  backfill: Required<RuntimeIntentBackfill>
}

export interface OrchestratorQueueWriter {
  writeImmediate: (payload: SpecQueueWritePayload) => void
  appendExecution: (payload: SpecQueueWritePayload) => void
  getQueueDepth: () => { specPending: number; planPending: number }
  getFiles: () => Array<{ name: string; content: string; language?: string }>
  setFiles: (files: Array<{ name: string; content: string; language?: string }>) => void
}

let intentCounter = 0

export function getOrchestratorMode(): OrchestratorMode {
  return isAideRuntimeProductionEnabled() ? 'production' : 'stub'
}

function nextIntentId(): string {
  intentCounter += 1
  return `${getOrchestratorMode()}-intent-${intentCounter}`
}

/** Enqueue spec task — production mode dual-writes queue + runs queue.before hooks. */
export async function enqueueSpecRuntimeIntent(
  intent: RuntimeIntent,
  writer?: OrchestratorQueueWriter,
): Promise<OrchestratorEnqueueResult> {
  const mode = getOrchestratorMode()
  const intentId = nextIntentId()
  const backfill = intent.backfill

  publishRuntimeEvent({
    type: 'queue.progress',
    at: new Date().toISOString(),
    message: `enqueue ${intent.kind}: ${intent.targetPath}`,
    meta: { intentId, source: intent.source ?? 'unknown', kind: intent.kind },
  })

  if (mode === 'stub' || !writer || !backfill?.taskPath) {
    return { accepted: true, mode, intentId }
  }

  const specName = specNameFromTasksPath(backfill.taskPath)
  const hooksContent = readHooksContentFromFiles(writer.getFiles(), backfill.taskPath)
  const hookBatch = await runHooksForEvent({
    event: 'queue.before',
    specName,
    tasksPath: backfill.taskPath,
    hooksYamlContent: hooksContent,
  })

  const files = upsertRuntimeStateInFiles(writer.getFiles(), {
    activeSpecPath: backfill.taskPath,
    queueSnapshot: {
      specPending: writer.getQueueDepth().specPending + 1,
      planPending: writer.getQueueDepth().planPending,
    },
    hookResults: hookResultsFromOutcomes(hookBatch.outcomes, backfill.taskPath),
  })
  writer.setFiles(files)

  if (hookBatch.shouldPauseQueue) {
    return {
      accepted: false,
      mode,
      intentId,
      pauseReason: 'queue.before hook failed',
    }
  }

  const payload: SpecQueueWritePayload = {
    prompt: intent.prompt,
    backfill: {
      taskPath: backfill.taskPath,
      taskText: backfill.taskText,
      specAcceptancePath: backfill.specAcceptancePath ?? backfill.taskPath.replace(/tasks\.md$/i, 'acceptance.md'),
    },
  }

  const depth = writer.getQueueDepth()
  if (depth.specPending === 0) {
    writer.writeImmediate(payload)
  } else {
    writer.appendExecution(payload)
  }

  publishSpecQueueIntent(backfill.taskPath, backfill.taskText)
  return { accepted: true, mode, intentId }
}

/** Legacy stub entry — event bus only. */
export function enqueueRuntimeIntent(intent: RuntimeIntent): OrchestratorEnqueueResult {
  const mode = getOrchestratorMode()
  const intentId = nextIntentId()

  publishRuntimeEvent({
    type: 'queue.progress',
    at: new Date().toISOString(),
    message: `[${mode}] enqueue ${intent.kind}: ${intent.targetPath}`,
    meta: {
      intentId,
      source: intent.source ?? 'unknown',
      kind: intent.kind,
    },
  })

  return { accepted: true, mode, intentId }
}
