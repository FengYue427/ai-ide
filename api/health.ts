/**
 * GET /api/health — dedicated Vercel function (filesystem route, no rewrite).
 */
export async function GET() {
  const { GET: healthGET } = await import('../lib/api/handlers/health')
  return healthGET()
}
