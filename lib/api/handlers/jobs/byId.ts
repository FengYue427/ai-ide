/**
 * Single background job — get by id (v1.1.2 F1)
 */
import { jsonResponse } from '../../http'
import { requireAuth } from '../../requireAuth'
import { localizedErrorResponse } from '../../localizedError'
import { getBackgroundJobForUser, serializeBackgroundJob } from '../../backgroundJobsService'

export async function GET(req: Request, ctx?: { params: Record<string, string> }) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const id = ctx?.params?.id
  if (!id) return localizedErrorResponse(req, 'api.job.idRequired', 400)

  try {
    const job = await getBackgroundJobForUser(auth.user.id, id)
    if (!job) return localizedErrorResponse(req, 'api.job.notFound', 404)

    return jsonResponse({ job: serializeBackgroundJob(job) })
  } catch (error) {
    console.error('[Jobs] Get error:', error)
    return localizedErrorResponse(req, 'api.job.loadFailed', 500)
  }
}
