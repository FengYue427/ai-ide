/** v1.5 F4/F6 — glue between UI queue, hooks, acceptance, runtime-state. */

import { isDesktopApp, getDesktopApi } from '../desktopBridge'
import { isAideRuntimeProductionEnabled } from '../../lib/v15Features'
import type { FileItem } from '../../types/file'
import { useIDEStore, type QueuedSpecBackfill, type QueuedSpecExecution } from '../../store/ideStore'
import { verifyAcceptanceAsync } from './acceptanceRunner'
import { formatAcceptanceVerifyFailures } from './acceptanceVerifyMessages'
import { readHooksContentFromFiles, runHooksForEvent } from './hookRunner'
import { publishSpecQueueIntent, publishVerifyFail } from './runtimeActivityPublishers'
import {
  enqueueSpecRuntimeIntent,
  type OrchestratorFilesUpdater,
  type OrchestratorQueueWriter,
  type RuntimeIntent,
} from './runtimeOrchestrator'
import { hookResultsFromOutcomes, upsertRuntimeStateInFiles } from './runtimeStateWriter'
import { specNameFromTasksPath } from './runtimeState'

export type CoordinatorFilesUpdater = OrchestratorFilesUpdater

/** @deprecated Use FileItem — kept for tests importing FileLike */
export type FileLike = FileItem

export interface SpecQueueCoordinatorDeps {
  getFiles: () => FileItem[]
  setFiles: (files: CoordinatorFilesUpdater) => void
  setQueuedChatPrompt: (prompt: string) => void
  setQueuedSpecBackfill: (backfill: QueuedSpecBackfill | null) => void
  appendSpecExecution: (item: QueuedSpecExecution) => void
  getSpecQueueDepth: () => number
  getPlanQueueDepth: () => number
  hasActiveSpecBackfill: () => boolean
}

function buildQueueWriter(deps: SpecQueueCoordinatorDeps): OrchestratorQueueWriter {
  return {
    writeImmediate: (payload) => {
      deps.setQueuedSpecBackfill(payload.backfill)
      deps.setQueuedChatPrompt(payload.prompt)
    },
    appendExecution: (payload) => {
      deps.appendSpecExecution({ prompt: payload.prompt, backfill: payload.backfill })
    },
    getQueueDepth: () => ({
      specPending: deps.getSpecQueueDepth() + (deps.hasActiveSpecBackfill() ? 1 : 0),
      planPending: deps.getPlanQueueDepth(),
    }),
    getFiles: deps.getFiles,
    setFiles: deps.setFiles,
  }
}

export function buildIdeSpecQueueCoordinatorDeps(handlers: {
  setFiles: SpecQueueCoordinatorDeps['setFiles']
  setQueuedChatPrompt: SpecQueueCoordinatorDeps['setQueuedChatPrompt']
  setQueuedSpecBackfill: SpecQueueCoordinatorDeps['setQueuedSpecBackfill']
  setQueuedSpecExecutions: (executions: QueuedSpecExecution[]) => void
}): SpecQueueCoordinatorDeps {
  return {
    getFiles: () => useIDEStore.getState().files,
    setFiles: handlers.setFiles,
    setQueuedChatPrompt: handlers.setQueuedChatPrompt,
    setQueuedSpecBackfill: handlers.setQueuedSpecBackfill,
    appendSpecExecution: (item) =>
      handlers.setQueuedSpecExecutions([...useIDEStore.getState().queuedSpecExecutions, item]),
    getSpecQueueDepth: () => useIDEStore.getState().queuedSpecExecutions.length,
    getPlanQueueDepth: () =>
      useIDEStore.getState().queuedPlanExecutions.length +
      (useIDEStore.getState().queuedPlanBackfill ? 1 : 0),
    hasActiveSpecBackfill: () => Boolean(useIDEStore.getState().queuedSpecBackfill),
  }
}

export async function enqueueSpecTaskViaRuntime(
  input: {
    tasksPath: string
    taskText: string
    specAcceptancePath: string
    prompt: string
  },
  deps: SpecQueueCoordinatorDeps,
): Promise<{ accepted: boolean; pauseReason?: string }> {
  if (!isAideRuntimeProductionEnabled()) {
    publishSpecQueueIntent(input.tasksPath, input.taskText)
    deps.setQueuedSpecBackfill({
      taskPath: input.tasksPath,
      taskText: input.taskText,
      specAcceptancePath: input.specAcceptancePath,
    })
    deps.setQueuedChatPrompt(input.prompt)
    return { accepted: true }
  }

  const intent: RuntimeIntent = {
    kind: 'spec',
    targetPath: input.tasksPath,
    prompt: input.prompt,
    backfill: {
      taskPath: input.tasksPath,
      taskText: input.taskText,
      specAcceptancePath: input.specAcceptancePath,
    },
    source: 'chat',
  }

  const result = await enqueueSpecRuntimeIntent(intent, buildQueueWriter(deps))
  return { accepted: result.accepted, pauseReason: result.pauseReason }
}

export async function onSpecQueueItemSucceeded(
  backfill: QueuedSpecBackfill,
  deps: SpecQueueCoordinatorDeps,
): Promise<{ verifyOk: boolean; verifyDetail?: string; enqueueIntents: RuntimeIntent[] }> {
  if (!isAideRuntimeProductionEnabled()) {
    return { verifyOk: true, enqueueIntents: [] }
  }

  const files = deps.getFiles()
  const specName = specNameFromTasksPath(backfill.taskPath)
  const hooksContent = readHooksContentFromFiles(files, backfill.taskPath)
  const acceptanceContent =
    files.find((file) => file.name === backfill.specAcceptancePath)?.content ?? ''

  const afterHooks = await runHooksForEvent({
    event: 'queue.after',
    specName,
    tasksPath: backfill.taskPath,
    hooksYamlContent: hooksContent,
  })

  const verify = await verifyAcceptanceAsync(acceptanceContent, {
    isDesktop: isDesktopApp(),
    runCommand: async (command) => {
      const api = getDesktopApi()
      if (!api?.runCommand) return { exitCode: 1 }
      return api.runCommand('', command)
    },
  })

  const verifyHooks = verify.ok
    ? { outcomes: [], shouldPauseQueue: false }
    : await runHooksForEvent({
        event: 'verify.fail',
        specName,
        tasksPath: backfill.taskPath,
        hooksYamlContent: hooksContent,
      })

  if (!verify.ok) {
    publishVerifyFail(specName, verify.failures[0] ?? 'acceptance failed')
  }

  const hookOutcomes = [...afterHooks.outcomes, ...verifyHooks.outcomes]
  const enqueueIntents = hookOutcomes
    .map((outcome) => outcome.enqueueIntent)
    .filter((intent): intent is RuntimeIntent => Boolean(intent))

  deps.setFiles(
    upsertRuntimeStateInFiles(deps.getFiles(), {
      activeSpecPath: backfill.taskPath,
      queueSnapshot: {
        specPending: Math.max(0, deps.getSpecQueueDepth()),
        planPending: deps.getPlanQueueDepth(),
      },
      hookResults: hookResultsFromOutcomes(
        hookOutcomes.map((row) => ({ hookId: row.hookId, status: row.status })),
        backfill.taskPath,
      ),
    }),
  )

  for (const intent of enqueueIntents) {
    await enqueueSpecRuntimeIntent(intent, buildQueueWriter(deps))
  }

  return {
    verifyOk: verify.ok,
    verifyDetail: verify.ok ? undefined : formatAcceptanceVerifyFailures(verify),
    enqueueIntents,
  }
}

export async function onAgentFilesApplied(
  paths: string[],
  deps: Pick<SpecQueueCoordinatorDeps, 'getFiles' | 'setFiles'>,
  activeTasksPath?: string | null,
): Promise<void> {
  if (!isAideRuntimeProductionEnabled() || !activeTasksPath) return

  const specName = specNameFromTasksPath(activeTasksPath)
  const hooksContent = readHooksContentFromFiles(deps.getFiles(), activeTasksPath)
  const batch = await runHooksForEvent({
    event: 'apply.after',
    specName,
    tasksPath: activeTasksPath,
    hooksYamlContent: hooksContent,
  })

  if (batch.outcomes.length === 0) return

  deps.setFiles(
    upsertRuntimeStateInFiles(deps.getFiles(), {
      activeSpecPath: activeTasksPath,
      hookResults: hookResultsFromOutcomes(batch.outcomes, activeTasksPath),
    }),
  )

  void paths
}
