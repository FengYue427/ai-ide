import type { BackgroundJob, Prisma } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'
import type {
  BackgroundJobProgress,
  BackgroundJobResultPayload,
  CreateBackgroundJobInput,
} from './backgroundJobTypes'
import { MAX_JOB_RUNTIME_MS } from './backgroundJobTypes'

export function serializeBackgroundJob(job: BackgroundJob) {
  return {
    id: job.id,
    status: job.status,
    repoKey: job.repoKey,
    prompt: job.prompt,
    progress: job.progress ?? null,
    result: job.result ?? null,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
  }
}

export async function createBackgroundJob(userId: string, input: CreateBackgroundJobInput) {
  const prompt = input.prompt.trim()
  const repoKey = input.repoKey?.trim() || null

  return prisma.backgroundJob.create({
    data: {
      userId,
      status: 'queued',
      prompt,
      repoKey,
    },
  })
}

export async function listBackgroundJobs(userId: string, limit: number) {
  return prisma.backgroundJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getBackgroundJobForUser(userId: string, jobId: string) {
  return prisma.backgroundJob.findFirst({
    where: { id: jobId, userId },
  })
}

export async function cancelBackgroundJobForUser(userId: string, jobId: string) {
  const job = await getBackgroundJobForUser(userId, jobId)
  if (!job) return { kind: 'not_found' as const }

  if (job.status !== 'queued' && job.status !== 'running') {
    return { kind: 'not_cancellable' as const, job }
  }

  const updated = await prisma.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: 'cancelled',
      finishedAt: new Date(),
    },
  })

  return { kind: 'cancelled' as const, job: updated }
}

export async function getBackgroundJobById(jobId: string) {
  return prisma.backgroundJob.findUnique({ where: { id: jobId } })
}

/** Atomically claim the oldest queued job. */
export async function claimNextQueuedBackgroundJob(): Promise<BackgroundJob | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const next = await prisma.backgroundJob.findFirst({
      where: { status: 'queued' },
      orderBy: { createdAt: 'asc' },
    })
    if (!next) return null

    const claimed = await prisma.backgroundJob.updateMany({
      where: { id: next.id, status: 'queued' },
      data: { status: 'running', startedAt: new Date() },
    })
    if (claimed.count === 1) {
      return prisma.backgroundJob.findUnique({ where: { id: next.id } })
    }
  }
  return null
}

export async function updateBackgroundJobProgress(jobId: string, progress: BackgroundJobProgress) {
  return prisma.backgroundJob.update({
    where: { id: jobId },
    data: { progress: progress as Prisma.InputJsonValue },
  })
}

async function finishIfNotCancelled(
  jobId: string,
  data: Prisma.BackgroundJobUpdateInput,
): Promise<BackgroundJob | null> {
  const current = await prisma.backgroundJob.findUnique({ where: { id: jobId } })
  if (!current || current.status === 'cancelled') return null

  return prisma.backgroundJob.update({
    where: { id: jobId },
    data,
  })
}

export async function completeBackgroundJobSucceeded(
  jobId: string,
  result: BackgroundJobResultPayload,
) {
  return finishIfNotCancelled(jobId, {
    status: 'succeeded',
    result: result as Prisma.InputJsonValue,
    error: null,
    finishedAt: new Date(),
    progress: {
      phase: 'done',
      updatedAt: new Date().toISOString(),
    } as Prisma.InputJsonValue,
  })
}

export async function completeBackgroundJobFailed(jobId: string, error: string) {
  return finishIfNotCancelled(jobId, {
    status: 'failed',
    error: error.slice(0, 4000),
    finishedAt: new Date(),
    progress: {
      phase: 'failed',
      updatedAt: new Date().toISOString(),
    } as Prisma.InputJsonValue,
  })
}

/** Mark long-running jobs as failed (cron recovery). */
export async function failStaleRunningBackgroundJobs(now = new Date()) {
  const cutoff = new Date(now.getTime() - MAX_JOB_RUNTIME_MS)
  const stale = await prisma.backgroundJob.updateMany({
    where: {
      status: 'running',
      startedAt: { lt: cutoff },
    },
    data: {
      status: 'failed',
      error: 'JOB_TIMEOUT',
      finishedAt: now,
    },
  })
  return stale.count
}
