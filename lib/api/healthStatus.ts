export type HealthPayload = {
  status: 'ok' | 'degraded'
  service: string
  version: string
  timestamp: string
  database?: string
  hints?: string[]
  billing?: {
    alipay: boolean
    wechat: boolean
    stripe: boolean
    devMock: boolean
  }
  platformAi?: {
    configured: boolean
    provider?: string
  }
  plugins?: {
    publishEnabled: boolean
    officialKeyConfigured: boolean
  }
}

export async function buildHealthCheck(options: {
  version?: string
  hasDatabaseUrl: boolean
  pingDatabase: () => Promise<void>
  billing?: HealthPayload['billing']
  platformAi?: HealthPayload['platformAi']
  plugins?: HealthPayload['plugins']
}): Promise<{ payload: HealthPayload; statusCode: number }> {
  const payload: HealthPayload = {
    status: 'ok',
    service: 'ai-ide-api',
    version: options.version ?? '1.0.0-rc.1',
    timestamp: new Date().toISOString(),
    billing: options.billing,
    platformAi: options.platformAi,
    plugins: options.plugins,
  }

  if (!options.hasDatabaseUrl) {
    payload.status = 'degraded'
    payload.database = 'not_configured'
    payload.hints = [
      'Set DATABASE_URL on Vercel (Neon pooler URL with sslmode=require).',
      'Set AUTH_SECRET (32+ random chars) and APP_URL to your deployment origin.',
    ]
    return { payload, statusCode: 503 }
  }

  try {
    await options.pingDatabase()
    payload.database = 'connected'
    return { payload, statusCode: 200 }
  } catch {
    payload.status = 'degraded'
    payload.database = 'unavailable'
    payload.hints = [
      'Verify Neon project is active and DATABASE_URL uses the pooler host.',
      'Redeploy after changing env vars; run npm run smoke:production.',
    ]
    return { payload, statusCode: 503 }
  }
}
