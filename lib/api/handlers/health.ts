/**
 * Health check for uptime monitors and post-deploy smoke tests.
 * GET /api/health — no auth required.
 */
import { buildHealthCheck } from '../healthStatus'
import { jsonResponse } from '../http'
import { getBillingCapabilities } from '../../billing/billingMode'
import { prisma } from '../../../src/lib/prisma'

export async function GET() {
  const billing = getBillingCapabilities()
  const { payload, statusCode } = await buildHealthCheck({
    version: process.env.npm_package_version ?? '1.0.0-rc.1',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
    pingDatabase: async () => {
      await prisma.$queryRaw`SELECT 1`
    },
    billing: {
      alipay: billing.alipay,
      wechat: billing.wechat,
      stripe: billing.stripe,
      devMock: billing.devMock,
    },
  })

  if (payload.database === 'unavailable') {
    console.error('[Health] database check failed')
  }

  return jsonResponse(payload, statusCode)
}
