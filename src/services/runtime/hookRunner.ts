/** v1.5 F4 — execute hooks.yaml hooks (browser honest skip). */

import { isDesktopApp, getDesktopApi } from '../desktopBridge'
import type { HookOnEvent, HooksDocument, RuntimeHookDef } from './hooksSchema'
import { parseHooksYaml, hooksPathFromTasksPath } from './hooksSchema'
import type { HookResultStatus } from './runtimeState'
import {
  publishHookEnd,
  publishHookStart,
} from './runtimeActivityPublishers'
import type { RuntimeIntent } from './runtimeOrchestrator'

export interface HookRunContext {
  event: HookOnEvent
  specName: string
  tasksPath: string
  hooksYamlContent?: string | null
  workspaceRoot?: string | null
}

export interface HookRunOutcome {
  hookId: string
  status: HookResultStatus
  message: string
  enqueueIntent?: RuntimeIntent
}

export interface HookRunBatchResult {
  outcomes: HookRunOutcome[]
  /** queue.before failure blocks queue drainage */
  shouldPauseQueue: boolean
}

function loadHooks(documentContent: string | null | undefined): RuntimeHookDef[] {
  if (!documentContent?.trim()) return []
  const parsed = parseHooksYaml(documentContent)
  return parsed.document?.hooks ?? []
}

async function runShellHook(hook: RuntimeHookDef, ctx: HookRunContext): Promise<HookRunOutcome> {
  if (!hook.command?.trim()) {
    return { hookId: hook.id, status: 'fail', message: 'empty command' }
  }

  if (!isDesktopApp()) {
    return {
      hookId: hook.id,
      status: 'skip',
      message: 'shell hook skipped in browser (desktop required)',
    }
  }

  const api = getDesktopApi()
  if (!api?.runCommand) {
    return { hookId: hook.id, status: 'skip', message: 'desktop runCommand unavailable' }
  }

  try {
    const result = await api.runCommand(ctx.workspaceRoot ?? '', hook.command)
    if (result.exitCode === 0) {
      return { hookId: hook.id, status: 'ok', message: hook.command }
    }
    return {
      hookId: hook.id,
      status: 'fail',
      message: `${hook.command} exited ${result.exitCode}`,
    }
  } catch (error) {
    return {
      hookId: hook.id,
      status: 'fail',
      message: error instanceof Error ? error.message : 'shell hook failed',
    }
  }
}

function runAgentHook(hook: RuntimeHookDef): HookRunOutcome {
  if (!hook.prompt?.trim()) {
    return { hookId: hook.id, status: 'fail', message: 'agent hook missing prompt' }
  }
  return {
    hookId: hook.id,
    status: 'skip',
    message: 'agent hook deferred to chat queue (v1.5 F4)',
  }
}

function runEnqueueHook(hook: RuntimeHookDef, _ctx: HookRunContext): HookRunOutcome {
  if (!hook.spec?.trim() || !hook.task?.trim()) {
    return { hookId: hook.id, status: 'fail', message: 'enqueue hook missing spec/task' }
  }

  const tasksPath = `.aide/specs/${hook.spec}/tasks.md`
  const acceptancePath = tasksPath.replace(/tasks\.md$/i, 'acceptance.md')

  return {
    hookId: hook.id,
    status: 'ok',
    message: `enqueue ${hook.spec}: ${hook.task}`,
    enqueueIntent: {
      kind: 'spec',
      targetPath: tasksPath,
      prompt: `请执行这个规格任务，并说明改动文件与验证步骤：\n\n[${tasksPath}] ${hook.task}`,
      backfill: {
        taskPath: tasksPath,
        taskText: hook.task,
        specAcceptancePath: acceptancePath,
      },
      source: 'hook',
    },
  }
}

async function runSingleHook(hook: RuntimeHookDef, ctx: HookRunContext): Promise<HookRunOutcome> {
  publishHookStart(hook.id, ctx.specName)

  let outcome: HookRunOutcome
  switch (hook.run) {
    case 'shell':
      outcome = await runShellHook(hook, ctx)
      break
    case 'agent':
      outcome = runAgentHook(hook)
      break
    case 'enqueue':
      outcome = runEnqueueHook(hook, ctx)
      break
    default:
      outcome = { hookId: hook.id, status: 'fail', message: `unsupported run: ${hook.run}` }
  }

  publishHookEnd(hook.id, outcome.status === 'ok' || outcome.status === 'skip', ctx.specName)
  return outcome
}

export async function runHooksForEvent(ctx: HookRunContext): Promise<HookRunBatchResult> {
  const hooks = loadHooks(ctx.hooksYamlContent).filter((hook) => hook.on === ctx.event)
  const outcomes: HookRunOutcome[] = []

  for (const hook of hooks) {
    outcomes.push(await runSingleHook(hook, ctx))
  }

  const shouldPauseQueue =
    ctx.event === 'queue.before' &&
    outcomes.some((outcome) => outcome.status === 'fail')

  return { outcomes, shouldPauseQueue }
}

export function readHooksContentFromFiles(
  files: Array<{ name: string; content: string }>,
  tasksPath: string,
): string | null {
  const hooksPath = hooksPathFromTasksPath(tasksPath)
  return files.find((file) => file.name === hooksPath)?.content ?? null
}

export function hooksDocumentFromContent(content: string | null | undefined): HooksDocument | null {
  if (!content?.trim()) return null
  const parsed = parseHooksYaml(content)
  return parsed.document ?? null
}
