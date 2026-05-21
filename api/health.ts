/**
 * GET /api/health — standalone Vercel entry (minimal imports for serverless bundle).
 */
export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL?.trim()
    if (!dbUrl) {
      return Response.json(
        {
          status: 'degraded',
          service: 'ai-ide-api',
          version: '1.0.0-rc.1',
          timestamp: new Date().toISOString(),
          database: 'not_configured',
        },
        { status: 503 },
      )
    }

    const safeUrl = dbUrl.replace(/[&?]channel_binding=[^&]*/gi, '').replace(/\?&/, '?')
    const isNeon = /neon\.tech/i.test(safeUrl)

    if (isNeon) {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(safeUrl)
      await sql`SELECT 1`
    } else {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      try {
        await prisma.$queryRaw`SELECT 1`
      } finally {
        await prisma.$disconnect()
      }
    }

    return Response.json({
      status: 'ok',
      service: 'ai-ide-api',
      version: '1.0.0-rc.1',
      timestamp: new Date().toISOString(),
      database: 'connected',
      billing: {
        alipay: Boolean(process.env.ALIPAY_APP_ID?.trim()),
        wechat: Boolean(process.env.WECHAT_MCH_ID?.trim()),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        devMock: false,
      },
    })
  } catch (error) {
    console.error('[api/health]', error)
    return Response.json(
      {
        status: 'degraded',
        service: 'ai-ide-api',
        timestamp: new Date().toISOString(),
        database: 'unavailable',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    )
  }
}
