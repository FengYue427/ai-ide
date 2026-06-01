/**
 * Health check for uptime monitors and post-deploy smoke tests.
 * GET /api/health — no auth required.
 *
 * Uses @neondatabase/serverless HTTP for Neon (no Prisma import — smaller Vercel bundle).
 */
import { neon } from '@neondatabase/serverless'
import { isPlatformAiConfigured, resolvePlatformAiRoute } from '../aiGateway/platformConfig'
import { buildHealthCheck } from '../healthStatus'
import { jsonResponse } from '../http'
import { getReleaseVersion } from '../releaseVersion'
import { getBillingCapabilities } from '../../billing/billingMode'
import {
  isPluginOfficialPublicKeyConfigured,
  isPluginPublishEnabled,
} from '../pluginPublishConfig'
import { sanitizeDatabaseUrl, shouldUseNeonAdapter } from '../../../src/lib/dbUrl'

export async function GET(_req: Request) {
  const billing = getBillingCapabilities()
  const dbUrl = process.env.DATABASE_URL?.trim()

  const platformRoute = resolvePlatformAiRoute()
  const { payload, statusCode } = await buildHealthCheck({
    version: getReleaseVersion(),
    hasDatabaseUrl: Boolean(dbUrl),
    platformAi: {
      configured: isPlatformAiConfigured(),
      provider: platformRoute.ok ? platformRoute.route.provider : undefined,
    },
    pingDatabase: async () => {
      if (!dbUrl) throw new Error('DATABASE_URL not set')
      if (shouldUseNeonAdapter(dbUrl)) {
        const sql = neon(sanitizeDatabaseUrl(dbUrl))
        await sql`SELECT 1`
        return
      }
      const { prisma } = await import('../../../src/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
    },
    billing: {
      alipay: billing.alipay,
      wechat: billing.wechat,
      stripe: billing.stripe,
      devMock: billing.devMock,
    },
    plugins: {
      publishEnabled: isPluginPublishEnabled(),
      officialKeyConfigured: isPluginOfficialPublicKeyConfigured(),
    },
  })

  if (payload.database === 'unavailable') {
    console.error('[Health] database check failed')
  }

  return jsonResponse(payload, statusCode)
}
