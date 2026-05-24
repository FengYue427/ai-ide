/**
 * Vercel Serverless entry source (built to api/index.js via npm run build:api).
 * Rewrites: /api/foo/bar → /api?__p=foo/bar
 */
import { dispatchApiRequest } from '../lib/api/dispatch'
import { logApi } from '../lib/api/logger'
import { attachRequestId, resolveRequestId } from '../lib/api/requestId'

async function requestForDispatch(request: Request, requestId: string): Promise<Request> {
  const url = new URL(request.url)
  const rest = url.searchParams.get('__p')
  const headers = new Headers(request.headers)
  headers.set('x-request-id', requestId)

  if (!rest) {
    return new Request(request.url, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    })
  }

  url.pathname = '/api/' + rest
  url.searchParams.delete('__p')

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? await request.arrayBuffer() : undefined

  return new Request(url.toString(), {
    method: request.method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  })
}

async function handle(request: Request): Promise<Response> {
  const requestId = resolveRequestId(request)
  const started = Date.now()
  const routeHint = new URL(request.url).searchParams.get('__p') || new URL(request.url).pathname

  try {
    const response = attachRequestId(
      await dispatchApiRequest(await requestForDispatch(request, requestId)),
      requestId,
    )
    logApi('info', 'api.request', {
      requestId,
      route: routeHint,
      method: request.method,
      status: response.status,
      durationMs: Date.now() - started,
    })
    return response
  } catch (error) {
    logApi('error', 'api.unhandled', {
      requestId,
      route: routeHint,
      method: request.method,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    })
    const exposeDetail = process.env.NODE_ENV !== 'production'
    return attachRequestId(
      new Response(
        JSON.stringify({
          error: 'Internal server error',
          requestId,
          ...(exposeDetail
            ? { detail: error instanceof Error ? error.message : String(error) }
            : {}),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      ),
      requestId,
    )
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
export const OPTIONS = handle
