export const BACKGROUND_JOB_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
] as const

export type BackgroundJobStatus = (typeof BACKGROUND_JOB_STATUSES)[number]

export const CANCELLABLE_JOB_STATUSES: BackgroundJobStatus[] = ['queued', 'running']

export const MAX_JOB_PROMPT_CHARS = 100_000
export const MAX_JOB_REPO_KEY_CHARS = 256
export const DEFAULT_JOB_LIST_LIMIT = 50
export const MAX_JOB_LIST_LIMIT = 100

/** Hard cap per v1.1.2 MVP (30 minutes). */
export const MAX_JOB_RUNTIME_MS = 30 * 60 * 1000

/** Jobs claimed per cron tick (Vercel function time budget). */
export const DEFAULT_JOBS_PER_CRON_TICK = 1

export type BackgroundJobWorkerMode = 'dummy' | 'agent'

export type BackgroundJobProgress = {
  phase: string
  round?: number
  updatedAt: string
}

export type BackgroundJobPendingChange = {
  path: string
  content: string
  language?: string
}

export type BackgroundJobCloudWriteback = {
  applied: boolean
  workspace: string
  paths: string[]
  error?: string
}

export type BackgroundJobResultPayload = {
  mode: BackgroundJobWorkerMode
  summary: string
  rounds?: number
  pendingChanges?: BackgroundJobPendingChange[]
  cloudWriteback?: BackgroundJobCloudWriteback
}

export function isJobRuntimeExpired(
  startedAt: Date | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!startedAt) return false
  return nowMs - startedAt.getTime() > MAX_JOB_RUNTIME_MS
}

export function resolveBackgroundJobWorkerMode(): BackgroundJobWorkerMode {
  const raw = process.env.BACKGROUND_JOB_WORKER_MODE?.trim().toLowerCase()
  if (raw === 'agent') return 'agent'
  return 'dummy'
}

export function isBackgroundJobStatus(value: string): value is BackgroundJobStatus {
  return (BACKGROUND_JOB_STATUSES as readonly string[]).includes(value)
}

export function canCancelBackgroundJob(status: string): boolean {
  return (CANCELLABLE_JOB_STATUSES as readonly string[]).includes(status)
}

export type CreateBackgroundJobInput = {
  prompt: string
  repoKey?: string | null
}

export type BackgroundJobValidationError =
  | 'api.job.promptRequired'
  | 'api.job.promptTooLong'
  | 'api.job.repoKeyTooLong'

export function validateCreateBackgroundJobInput(
  input: CreateBackgroundJobInput,
): BackgroundJobValidationError | null {
  const prompt = input.prompt?.trim() ?? ''
  if (!prompt) return 'api.job.promptRequired'
  if (prompt.length > MAX_JOB_PROMPT_CHARS) return 'api.job.promptTooLong'

  const repoKey = input.repoKey?.trim()
  if (repoKey && repoKey.length > MAX_JOB_REPO_KEY_CHARS) return 'api.job.repoKeyTooLong'

  return null
}

export function normalizeJobListLimit(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return DEFAULT_JOB_LIST_LIMIT
  const n = Math.floor(raw)
  if (n < 1) return 1
  if (n > MAX_JOB_LIST_LIMIT) return MAX_JOB_LIST_LIMIT
  return n
}
