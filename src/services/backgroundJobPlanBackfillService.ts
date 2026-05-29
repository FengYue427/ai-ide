import type { TranslateFn } from '../i18n'
import type { ToastKind } from '../components/FeedbackCenter'
import type { SerializedBackgroundJob } from './backgroundJobsApiService'
import { loadBackgroundJobNotifyPrefs } from './backgroundJobNotifyPrefsService'
import { markPlanStepDone } from './planStepCompletionService'
import { parsePlanBackgroundJobPrompt } from './planExecutionService'

type FileLike = { name: string; content: string; language?: string }

export function tryMarkPlanStepFromBackgroundJob<T extends FileLike>(
  files: T[],
  job: SerializedBackgroundJob,
): { files: T[]; planPath: string; stepText: string } | null {
  if (job.status !== 'succeeded') return null
  const meta = parsePlanBackgroundJobPrompt(job.prompt)
  if (!meta) return null
  const next = markPlanStepDone(files, meta.planPath, { text: meta.stepText })
  const changed = next.some((f, i) => f.content !== files[i]?.content)
  if (!changed) return null
  return { files: next, planPath: meta.planPath, stepText: meta.stepText }
}

export function maybeAutoMarkPlanStepFromJob<T extends FileLike>(
  files: T[],
  job: SerializedBackgroundJob,
  applyFiles: (files: T[]) => void,
  notify: ((kind: ToastKind, title: string, detail?: string) => void) | undefined,
  t: TranslateFn,
): void {
  if (!loadBackgroundJobNotifyPrefs().autoMarkPlanStep) return
  const result = tryMarkPlanStepFromBackgroundJob(files, job)
  if (!result) return
  applyFiles(result.files)
  notify?.(
    'success',
    t('backgroundJobs.planStepMarked'),
    t('backgroundJobs.planStepMarkedDetail', { path: result.planPath, step: result.stepText }),
  )
}
