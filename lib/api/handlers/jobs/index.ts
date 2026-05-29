/**
 * Background jobs API — create + list (v1.1.2 F1)
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { readJsonWithLimit } from '../../body'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import {
  createBackgroundJob,
  listBackgroundJobs,
  serializeBackgroundJob,
} from '../../backgroundJobsService'
import { assertCanCreateBackgroundJob } from '../../backgroundJobEntitlement'
import {
  DEFAULT_JOB_LIST_LIMIT,
  normalizeJobListLimit,
  validateCreateBackgroundJobInput,
} from '../../backgroundJobTypes'
import { resolveUserPlanName } from '../../../billing/usageDb'

const MAX_JOB_BODY_BYTES = 256_000

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const url = new URL(req.url)
    const limit = normalizeJobListLimit(
      url.searchParams.has('limit')
        ? Number(url.searchParams.get('limit'))
        : DEFAULT_JOB_LIST_LIMIT,
    )

    const jobs = await listBackgroundJobs(auth.user.id, limit)
    return jsonResponse({ jobs: jobs.map(serializeBackgroundJob) })
  } catch (error) {
    console.error('[Jobs] List error:', error)
    return localizedErrorResponse(req, 'api.job.listFailed', 500)
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  try {
    const parsed = await readJsonWithLimit<{ prompt?: unknown; repoKey?: unknown }>(
      req,
      MAX_JOB_BODY_BYTES,
    )
    if (!parsed.ok) return parsed.response

    const prompt = typeof parsed.value.prompt === 'string' ? parsed.value.prompt : ''
    const repoKey =
      parsed.value.repoKey == null
        ? null
        : typeof parsed.value.repoKey === 'string'
          ? parsed.value.repoKey
          : ''

    const validationError = validateCreateBackgroundJobInput({ prompt, repoKey })
    if (validationError) {
      return localizedErrorResponse(req, validationError, 400)
    }

    const planName = await resolveUserPlanName(auth.user.id)
    const entitlement = await assertCanCreateBackgroundJob(auth.user.id, planName)
    if (!entitlement.ok) {
      return localizedErrorResponse(
        req,
        entitlement.error.key,
        429,
        entitlement.error.params,
      )
    }

    const job = await createBackgroundJob(auth.user.id, { prompt, repoKey })
    return jsonResponse(
      appendApiMessage(req, 'api.job.created', {
        job: serializeBackgroundJob(job),
      }),
      201,
    )
  } catch (error) {
    console.error('[Jobs] Create error:', error)
    return localizedErrorResponse(req, 'api.job.createFailed', 500)
  }
}
