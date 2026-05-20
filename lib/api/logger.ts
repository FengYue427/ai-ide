export type ApiLogLevel = 'info' | 'warn' | 'error'

export interface ApiLogFields {
  requestId?: string
  route?: string
  method?: string
  status?: number
  durationMs?: number
  event?: string
  userId?: string
  error?: string
  [key: string]: unknown
}

function write(level: ApiLogLevel, message: string, fields?: ApiLogFields): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export function logApi(level: ApiLogLevel, message: string, fields?: ApiLogFields): void {
  write(level, message, fields)
}

export function logApiEvent(event: string, fields?: ApiLogFields): void {
  write('info', event, { ...fields, event })
}

export function getRequestIdFromHeaders(req: Request): string {
  return req.headers.get('x-request-id')?.trim() || 'unknown'
}

export function trackServerEvent(req: Request, event: string, fields?: ApiLogFields): void {
  logApiEvent(event, {
    requestId: getRequestIdFromHeaders(req),
    ...fields,
  })
}
