/**
 * GET /api/health — standalone Vercel entry (minimal imports for serverless bundle).
 */
import { getReleaseVersion } from '../lib/api/releaseVersion.js'

export async function GET() {
  const version = getReleaseVersion()
  try {
    const dbUrl = process.env.DATABASE_URL?.trim()
    if (!dbUrl) {
      return Response.json(
        {
          status: 'degraded',
          service: 'ai-ide-api',
          version,
          timestamp: new Date().toISOString(),
          database: 'not_configured',
          checks: {
            authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
            prismaRouter: 'skipped',
          },
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

    let prismaRouter: 'connected' | 'unavailable' | 'skipped' = 'skipped'
    try {
      const { prisma } = await import('../src/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      prismaRouter = 'connected'
    } catch (prismaError) {
      prismaRouter = 'unavailable'
      console.error('[api/health] prisma router probe failed:', prismaError)
    }

    return Response.json({
      status: 'ok',
      service: 'ai-ide-api',
      version,
      timestamp: new Date().toISOString(),
      database: 'connected',
      billing: {
        alipay: Boolean(process.env.ALIPAY_APP_ID?.trim()),
        wechat: Boolean(process.env.WECHAT_MCH_ID?.trim()),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
        devMock: false,
      },
      checks: {
        authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
        prismaRouter,
      },
    })
  } catch (error) {
    console.error('[api/health]', error)
    return Response.json(
      {
        status: 'degraded',
        service: 'ai-ide-api',
        version,
        timestamp: new Date().toISOString(),
        database: 'unavailable',
        detail: error instanceof Error ? error.message : String(error),
        checks: {
          authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
          prismaRouter: 'skipped',
        },
      },
      { status: 503 },
    )
  }
}
