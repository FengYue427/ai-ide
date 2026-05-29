/**
 * Batch create background jobs (v1.1.2.7 Plan queue).
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { createBackgroundJob, serializeBackgroundJob } from '../../backgroundJobsService'
import { assertCanCreateBackgroundJob } from '../../backgroundJobEntitlement'
import {
  MAX_BACKGROUND_JOBS_BATCH,
  validateCreateBackgroundJobInput,
} from '../../backgroundJobTypes'
import { resolveUserPlanName } from '../../../billing/usageDb'

const MAX_JOB_BODY_BYTES = 512_000

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const parsed = await readJsonWithLimit<{ prompts?: unknown; repoKey?: unknown }>(
      req,
      MAX_JOB_BODY_BYTES,
    )
    if (!parsed.ok) return parsed.response

    const rawPrompts = parsed.value.prompts
    if (!Array.isArray(rawPrompts) || rawPrompts.length === 0) {
      return localizedErrorResponse(req, 'api.job.batchEmpty', 400)
    }

    const prompts = rawPrompts
      .filter((p): p is string => typeof p === 'string')
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, MAX_BACKGROUND_JOBS_BATCH)

    if (prompts.length === 0) {
      return localizedErrorResponse(req, 'api.job.batchEmpty', 400)
    }

    const repoKey =
      parsed.value.repoKey == null
        ? null
        : typeof parsed.value.repoKey === 'string'
          ? parsed.value.repoKey
          : ''

    for (const prompt of prompts) {
      const validationError = validateCreateBackgroundJobInput({ prompt, repoKey })
      if (validationError) {
        return localizedErrorResponse(req, validationError, 400)
      }
    }

    const planName = await resolveUserPlanName(auth.user.id)
    const jobs = []
    let created = 0
    let skipped = 0
    let lastError: { key: string; params?: Record<string, string | number> } | null = null

    for (const prompt of prompts) {
      const entitlement = await assertCanCreateBackgroundJob(auth.user.id, planName)
      if (!entitlement.ok) {
        lastError = entitlement.error
        skipped += prompts.length - created - skipped
        break
      }

      const job = await createBackgroundJob(auth.user.id, { prompt, repoKey })
      jobs.push(serializeBackgroundJob(job))
      created++
    }

    const status = created > 0 ? 201 : 429
    return jsonResponse(
      appendApiMessage(req, 'api.job.batchCreated', {
        jobs,
        created,
        skipped,
        requested: prompts.length,
        ...(lastError ? { limitReason: lastError.key, limitParams: lastError.params } : {}),
      }),
      status,
    )
  } catch (error) {
    console.error('[Jobs] Batch create error:', error)
    return localizedErrorResponse(req, 'api.job.createFailed', 500)
  }
}
