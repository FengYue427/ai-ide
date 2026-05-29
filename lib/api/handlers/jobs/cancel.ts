/**
 * Cancel background job (v1.1.2 F1)
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { cancelBackgroundJobForUser, serializeBackgroundJob } from '../../backgroundJobsService'

export async function POST(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return localizedErrorResponse(req, 'api.job.idRequired', 400)

  try {
    const result = await cancelBackgroundJobForUser(auth.user.id, id)
    if (result.kind === 'not_found') {
      return localizedErrorResponse(req, 'api.job.notFound', 404)
    }
    if (result.kind === 'not_cancellable') {
      return localizedErrorResponse(req, 'api.job.notCancellable', 409)
    }

    return jsonResponse(
      appendApiMessage(req, 'api.job.cancelled', {
        job: serializeBackgroundJob(result.job),
      }),
    )
  } catch (error) {
    console.error('[Jobs] Cancel error:', error)
    return localizedErrorResponse(req, 'api.job.cancelFailed', 500)
  }
}
