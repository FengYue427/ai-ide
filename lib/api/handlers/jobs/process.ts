/**
 * Cron: process queued background jobs (v1.1.2 F2).
 * Auth: Authorization: Bearer ${CRON_SECRET} or ${BILLING_CRON_SECRET}
 */
import { isCronAuthorized } from '../../cronAuth'
import { jsonResponse } from '../../http'
import { appendApiMessage, localizedErrorResponse } from '../../localizedError'
import { processBackgroundJobs } from '../../backgroundJobProcessor'

async function runProcess(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return localizedErrorResponse(request, 'api.auth.unauthorized', 401)
  }

  try {
    const result = await processBackgroundJobs()
    return jsonResponse(
      appendApiMessage(request, 'api.job.processCronOk', {
        success: true,
        ...result,
      }),
    )
  } catch (error) {
    console.error('[Jobs process cron] error:', error)
    return localizedErrorResponse(request, 'api.job.processFailed', 500)
  }
}

export async function GET(request: Request) {
  return runProcess(request)
}

export async function POST(request: Request) {
  return runProcess(request)
}
