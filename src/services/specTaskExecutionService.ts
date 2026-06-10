import type { Language } from '../i18n'
import { acceptancePathFromTasksPath } from '../lib/specStudioPaths'
import type { FileItem } from '../types/file'
import { listSpecTasksPaths } from './planSpecsBridgeService'
import { buildSpecExecutionPrompt } from './planSpecWorkflowService'
import { parseProjectTasks } from './projectTasksService'
import {
  enqueueSpecTaskViaRuntime,
  type SpecQueueCoordinatorDeps,
} from './runtime/runtimeQueueCoordinator'

export { acceptancePathFromTasksPath }

export type FirstOpenSpecTaskResult =
  | { ok: false; reason: 'missing-file' | 'no-open-task' }
  | { ok: true; accepted: boolean; pauseReason?: string; taskText: string }

export function findFirstOpenSpecTask(
  files: FileItem[],
  tasksPath: string,
): { taskText: string } | null {
  const file = files.find((item) => item.name === tasksPath)
  if (!file) return null
  const first = parseProjectTasks(file.content).find((task) => !task.done)
  if (!first) return null
  return { taskText: first.text }
}

/** First spec tasks.md (catalog order) that has an unchecked task. */
export function findFirstRunnableSpecTasksPath(files: FileItem[]): string | null {
  for (const tasksPath of listSpecTasksPaths(files)) {
    if (findFirstOpenSpecTask(files, tasksPath)) return tasksPath
  }
  return null
}

export async function enqueueFirstOpenSpecTaskViaRuntime(
  input: { tasksPath: string; language: Language },
  deps: SpecQueueCoordinatorDeps,
): Promise<FirstOpenSpecTaskResult> {
  const files = deps.getFiles()
  if (!files.some((item) => item.name === input.tasksPath)) {
    return { ok: false, reason: 'missing-file' }
  }
  const first = findFirstOpenSpecTask(files, input.tasksPath)
  if (!first) {
    return { ok: false, reason: 'no-open-task' }
  }

  const prompt = buildSpecExecutionPrompt(input.tasksPath, first.taskText, input.language)
  const result = await enqueueSpecTaskViaRuntime(
    {
      tasksPath: input.tasksPath,
      taskText: first.taskText,
      specAcceptancePath: acceptancePathFromTasksPath(input.tasksPath),
      prompt,
    },
    deps,
  )

  return {
    ok: true,
    accepted: result.accepted,
    pauseReason: result.pauseReason,
    taskText: first.taskText,
  }
}
