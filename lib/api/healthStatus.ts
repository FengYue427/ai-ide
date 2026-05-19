export type HealthPayload = {
  status: 'ok' | 'degraded'
  service: string
  version: string
  timestamp: string
  database?: string
  billing?: {
    alipay: boolean
    wechat: boolean
    stripe: boolean
    devMock: boolean
  }
}

export async function buildHealthCheck(options: {
  version?: string
  hasDatabaseUrl: boolean
  pingDatabase: () => Promise<void>
  billing?: HealthPayload['billing']
}): Promise<{ payload: HealthPayload; statusCode: number }> {
  const payload: HealthPayload = {
    status: 'ok',
    service: 'ai-ide-api',
    version: options.version ?? '1.0.0-rc.1',
    timestamp: new Date().toISOString(),
    billing: options.billing,
  }

  if (!options.hasDatabaseUrl) {
    payload.status = 'degraded'
    payload.database = 'not_configured'
    return { payload, statusCode: 503 }
  }

  try {
    await options.pingDatabase()
    payload.database = 'connected'
    return { payload, statusCode: 200 }
  } catch {
    payload.status = 'degraded'
    payload.database = 'unavailable'
    return { payload, statusCode: 503 }
  }
}
