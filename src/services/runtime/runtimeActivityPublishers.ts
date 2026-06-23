/** v1.5 F5 — Activity Line event publishers (queue · agent · hooks). */

import { publishRuntimeEvent } from './runtimeEventBus'
import { specNameFromTasksPath } from './specHookLog'
import type { LinkageReason } from '../../lib/linkageReason'
import { appendBecauseToMeta } from '../../lib/linkageReason'

export function publishQueueProgress(message: string, meta?: Record<string, string | number | boolean>): void {
  publishRuntimeEvent({
    type: 'queue.progress',
    at: new Date().toISOString(),
    message,
    meta,
  })
}

export function publishAgentFileWrite(path: string, meta?: Record<string, string | number | boolean>): void {
  publishRuntimeEvent({
    type: 'agent.fileWrite',
    at: new Date().toISOString(),
    message: path,
    meta,
  })
}

export function publishHookStart(hookId: string, specName?: string): void {
  publishRuntimeEvent({
    type: 'hook.start',
    at: new Date().toISOString(),
    message: hookId,
    meta: specName ? { spec: specName } : undefined,
  })
}

export function publishHookEnd(hookId: string, ok: boolean, specName?: string): void {
  publishRuntimeEvent({
    type: 'hook.end',
    at: new Date().toISOString(),
    message: hookId,
    meta: { ok, ...(specName ? { spec: specName } : {}) },
  })
}

export function publishVerifyFail(specName: string, detail: string): void {
  publishRuntimeEvent({
    type: 'verify.fail',
    at: new Date().toISOString(),
    message: detail,
    meta: { spec: specName },
  })
}

export function publishSpecQueueIntent(tasksPath: string, taskText: string): void {
  const specName = specNameFromTasksPath(tasksPath)
  publishQueueProgress(`spec queue: ${taskText.slice(0, 80)}`, {
    tasksPath,
    ...(specName ? { spec: specName } : {}),
  })
}

export function publishGroundingBlock(tasksPath: string, taskText: string, detail: string): void {
  const specName = specNameFromTasksPath(tasksPath)
  publishRuntimeEvent({
    type: 'grounding.block',
    at: new Date().toISOString(),
    message: detail,
    meta: {
      tasksPath,
      taskText: taskText.slice(0, 80),
      ...(specName ? { spec: specName } : {}),
    },
  })
}

export function publishAutopilotLoopEvent(
  phase: 'start' | 'step' | 'stop',
  message: string,
  meta?: Record<string, string | number | boolean>,
  because?: LinkageReason[],
): void {
  publishRuntimeEvent({
    type: 'autopilot.loop',
    at: new Date().toISOString(),
    message: `${phase}: ${message}`,
    meta: appendBecauseToMeta({ phase, ...meta }, because ?? []),
  })
}

export function publishAutopilotBackgroundEvent(
  phase: 'start' | 'step' | 'stop',
  message: string,
  meta?: Record<string, string | number | boolean>,
  because?: LinkageReason[],
): void {
  publishRuntimeEvent({
    type: 'autopilot.background',
    at: new Date().toISOString(),
    message: `${phase}: ${message}`,
    meta: appendBecauseToMeta({ phase, ...meta }, because ?? []),
  })
}

export function publishAutopilotGoalEvent(
  phase: 'start' | 'step' | 'stop',
  message: string,
  meta?: Record<string, string | number | boolean>,
  because?: LinkageReason[],
): void {
  publishRuntimeEvent({
    type: 'autopilot.goal',
    at: new Date().toISOString(),
    message: `${phase}: ${message}`,
    meta: appendBecauseToMeta({ phase, ...meta }, because ?? []),
  })
}
