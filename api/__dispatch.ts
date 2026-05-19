/**
 * Single Vercel Node function for all /api/* routes (Vite is not Next.js:
 * nested `api/[[...path]]/route.ts` is not deployed). `vercel.json` rewrites
 * `/api/foo/bar` → `/api/__dispatch?__p=foo/bar`; we restore the path here.
 */
import { dispatchApiRequest } from '../lib/api/dispatch'

async function requestForDispatch(request: Request): Promise<Request> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/__dispatch') return request

  const rest = url.searchParams.get('__p')
  if (rest == null || rest === '') return request

  url.pathname = '/api/' + rest
  url.searchParams.delete('__p')

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? await request.arrayBuffer() : undefined

  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: body && body.byteLength > 0 ? body : undefined,
  })
}

async function handle(request: Request): Promise<Response> {
  try {
    return await dispatchApiRequest(await requestForDispatch(request))
  } catch (error) {
    console.error('[api/__dispatch]', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        detail: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
export const OPTIONS = handle
