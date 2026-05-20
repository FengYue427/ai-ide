/**
 * GET /api/health — dedicated Vercel function (filesystem route, no rewrite).
 */
import { attachRequestId, resolveRequestId } from '../lib/api/requestId'

export async function GET(request: Request) {
  const requestId = resolveRequestId(request)
  const { GET: healthGET } = await import('../lib/api/handlers/health')
  const headers = new Headers(request.headers)
  headers.set('x-request-id', requestId)
  const reqWithId = new Request(request.url, { method: request.method, headers })
  return attachRequestId(await healthGET(reqWithId), requestId)
}
