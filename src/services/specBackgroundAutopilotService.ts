import type { Language } from '../i18n'
import type { TranslateFn } from '../i18n'
import { findFirstOpenSpecTask } from './specTaskExecutionService'
import { buildSpecExecutionPrompt } from './planSpecWorkflowService'
import {
  createBackgroundJob,
  listBackgroundJobs,
  type SerializedBackgroundJob,
} from './backgroundJobsApiService'
import type { FileItem } from '../types/file'

export function buildSpecBackgroundJobPrompt(
  tasksPath: string,
  taskText: string,
  locale: Language = 'zh-CN',
): string {
  return `## Spec\nPath: ${tasksPath.trim()}\nTask: ${taskText.trim()}\n\n${buildSpecExecutionPrompt(tasksPath, taskText, locale)}`
}

export function parseSpecBackgroundJobPrompt(
  prompt: string,
): { tasksPath: string; taskText: string } | null {
  const pathMatch = prompt.match(/^## Spec\s*\r?\nPath:\s*(.+)$/m)
  const taskMatch = prompt.match(/^Task:\s*(.+)$/m)
  if (!pathMatch?.[1] || !taskMatch?.[1]) return null
  return { tasksPath: pathMatch[1].trim(), taskText: taskMatch[1].trim() }
}

function normalizeTaskText(text: string): string {
  return text.trim().toLowerCase()
}

export function isSpecTaskQueuedInJobs(
  jobs: Array<{ prompt: string; status: string }>,
  tasksPath: string,
  taskText: string,
): boolean {
  const targetPath = tasksPath.trim()
  const targetTask = normalizeTaskText(taskText)
  if (!targetPath || !targetTask) return false

  for (const job of jobs) {
    if (job.status !== 'queued' && job.status !== 'running') continue
    const meta = parseSpecBackgroundJobPrompt(job.prompt)
    if (!meta) continue
    if (meta.tasksPath !== targetPath) continue
    if (normalizeTaskText(meta.taskText) === targetTask) return true
  }
  return false
}

export type QueueSpecBackgroundJobResult = {
  job?: SerializedBackgroundJob
  taskText?: string
  skipped?: 'duplicate' | 'no-open-task' | 'missing-file'
  error?: string
}

function normalizeRepoKey(repoKey?: string | null): string {
  return (repoKey?.trim() || 'default').slice(0, 256)
}

export async function queueNextOpenSpecTaskAsBackgroundJob(
  files: FileItem[],
  tasksPath: string,
  options?: {
    repoKey?: string | null
    language?: Language
    t?: TranslateFn
    existingJobs?: SerializedBackgroundJob[]
  },
): Promise<QueueSpecBackgroundJobResult> {
  const open = findFirstOpenSpecTask(files, tasksPath)
  if (!open) {
    return { skipped: files.some((f) => f.name === tasksPath) ? 'no-open-task' : 'missing-file' }
  }

  const existing = options?.existingJobs ?? (await listBackgroundJobs(50)).jobs
  if (isSpecTaskQueuedInJobs(existing, tasksPath, open.taskText)) {
    return { skipped: 'duplicate', taskText: open.taskText }
  }

  const prompt = buildSpecBackgroundJobPrompt(tasksPath, open.taskText, options?.language ?? 'zh-CN')
  const result = await createBackgroundJob(
    { prompt, repoKey: normalizeRepoKey(options?.repoKey) },
    options?.t,
  )

  if (result.error || !result.job) {
    return { error: result.error ?? 'create failed', taskText: open.taskText }
  }

  return { job: result.job, taskText: open.taskText }
}
