import { apiFetch, readJsonResponse } from './apiUtils'
import { pickApiResponseMessage } from '../lib/apiUserMessage'
import type { TranslateFn } from '../i18n'

export type BackgroundJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type BackgroundJobPendingChangeClient = {
  path: string
  content?: string
  language?: string
}

export type BackgroundJobCloudWritebackClient = {
  applied: boolean
  workspace: string
  paths?: string[]
  error?: string
}

export type SerializedBackgroundJob = {
  id: string
  status: BackgroundJobStatus
  repoKey: string | null
  prompt: string
  progress: { phase?: string; round?: number; updatedAt?: string } | null
  result: {
    mode?: string
    summary?: string
    rounds?: number
    pendingChanges?: BackgroundJobPendingChangeClient[]
    cloudWriteback?: BackgroundJobCloudWritebackClient
  } | null
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

export function isActiveBackgroundJobStatus(status: BackgroundJobStatus): boolean {
  return status === 'queued' || status === 'running'
}

export function isTerminalBackgroundJobStatus(status: BackgroundJobStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled'
}

async function parseJobResponse(
  response: Response,
  t?: TranslateFn,
): Promise<{ job?: SerializedBackgroundJob; error?: string }> {
  const json = await readJsonResponse<{
    job?: SerializedBackgroundJob
    error?: string
    message?: string
    messageKey?: string
  }>(response)
  if (!response.ok) {
    return {
      error:
        pickApiResponseMessage(json ?? undefined, t) ??
        json?.error ??
        `HTTP ${response.status}`,
    }
  }
  return { job: json?.job }
}

export async function listBackgroundJobs(
  limit = 50,
): Promise<{ jobs: SerializedBackgroundJob[]; error?: string }> {
  const response = await apiFetch(`/api/jobs?limit=${limit}`, { credentials: 'include' })
  const json = await readJsonResponse<{
    jobs?: SerializedBackgroundJob[]
    error?: string
    message?: string
  }>(response)
  if (!response.ok) {
    return {
      jobs: [],
      error: json?.error ?? json?.message ?? `HTTP ${response.status}`,
    }
  }
  return { jobs: json?.jobs ?? [] }
}

export async function getBackgroundJob(
  id: string,
  t?: TranslateFn,
): Promise<{ job?: SerializedBackgroundJob; error?: string }> {
  const response = await apiFetch(`/api/jobs/${encodeURIComponent(id)}`, {
    credentials: 'include',
  })
  return parseJobResponse(response, t)
}

export async function createBackgroundJob(
  input: { prompt: string; repoKey?: string | null },
  t?: TranslateFn,
): Promise<{ job?: SerializedBackgroundJob; error?: string }> {
  const response = await apiFetch('/api/jobs', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJobResponse(response, t)
}

export type CreateBackgroundJobsBatchResult = {
  jobs: SerializedBackgroundJob[]
  created: number
  skipped?: number
  requested?: number
  error?: string
}

export async function createBackgroundJobsBatch(
  input: { prompts: string[]; repoKey?: string | null },
  t?: TranslateFn,
): Promise<CreateBackgroundJobsBatchResult> {
  const response = await apiFetch('/api/jobs/batch', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await readJsonResponse<{
    jobs?: SerializedBackgroundJob[]
    created?: number
    skipped?: number
    requested?: number
    error?: string
    message?: string
    messageKey?: string
  }>(response)

  if (!response.ok) {
    return {
      jobs: json?.jobs ?? [],
      created: json?.created ?? 0,
      skipped: json?.skipped,
      error:
        pickApiResponseMessage(json ?? undefined, t) ??
        json?.error ??
        `HTTP ${response.status}`,
    }
  }

  return {
    jobs: json?.jobs ?? [],
    created: json?.created ?? json?.jobs?.length ?? 0,
    skipped: json?.skipped,
    requested: json?.requested,
  }
}

export async function cancelBackgroundJob(
  id: string,
  t?: TranslateFn,
): Promise<{ job?: SerializedBackgroundJob; error?: string }> {
  const response = await apiFetch(`/api/jobs/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  return parseJobResponse(response, t)
}
