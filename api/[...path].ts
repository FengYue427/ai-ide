// Catch-all Vercel Serverless entry (Vite is not Next.js).
// Use api/[...path].ts — nested api/**/route.ts folders are not deployed.
import { dispatchApiRequest } from '../lib/api/dispatch'

async function handle(request: Request): Promise<Response> {
  try {
    return await dispatchApiRequest(request)
  } catch (error) {
    console.error('[api]', error)
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
