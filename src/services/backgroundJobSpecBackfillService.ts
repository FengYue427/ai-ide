import type { TranslateFn } from '../i18n'
import type { ToastKind } from '../components/FeedbackCenter'
import type { SerializedBackgroundJob } from './backgroundJobsApiService'
import { parseSpecBackgroundJobPrompt } from './specBackgroundAutopilotService'
import { markSpecTaskDone } from './specTaskCompletionService'

type FileLike = { name: string; content: string; language?: string }

export function tryMarkSpecTaskFromBackgroundJob<T extends FileLike>(
  files: T[],
  job: SerializedBackgroundJob,
): { files: T[]; tasksPath: string; taskText: string } | null {
  if (job.status !== 'succeeded') return null
  const meta = parseSpecBackgroundJobPrompt(job.prompt)
  if (!meta) return null
  const next = markSpecTaskDone(files, meta.tasksPath, meta.taskText)
  const changed = next.some((f, i) => f.content !== files[i]?.content)
  if (!changed) return null
  return { files: next, tasksPath: meta.tasksPath, taskText: meta.taskText }
}

export function maybeMarkSpecTaskFromBackgroundJob<T extends FileLike>(
  files: T[],
  job: SerializedBackgroundJob,
  applyFiles: (files: T[]) => void,
  notify: ((kind: ToastKind, title: string, detail?: string) => void) | undefined,
  t: TranslateFn,
): { tasksPath: string; taskText: string } | null {
  const result = tryMarkSpecTaskFromBackgroundJob(files, job)
  if (!result) return null
  applyFiles(result.files)
  notify?.(
    'success',
    t('backgroundJobs.specTaskMarked'),
    t('backgroundJobs.specTaskMarkedDetail', { path: result.tasksPath, task: result.taskText }),
  )
  return { tasksPath: result.tasksPath, taskText: result.taskText }
}
