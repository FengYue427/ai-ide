import { createHmac, timingSafeEqual } from 'crypto'

export type PaddleWebhookEvent = {
  event_id?: string
  event_type?: string
  occurred_at?: string
  data?: Record<string, unknown>
}

export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret?: string,
): boolean {
  const webhookSecret = secret?.trim() || process.env.PADDLE_WEBHOOK_SECRET?.trim()
  if (!webhookSecret || !signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(';').map((segment) => {
      const eq = segment.indexOf('=')
      if (eq === -1) return [segment.trim(), '']
      return [segment.slice(0, eq).trim(), segment.slice(eq + 1).trim()]
    }),
  ) as { ts?: string; h1?: string }

  if (!parts.ts || !parts.h1) return false

  const signedPayload = `${parts.ts}:${rawBody}`
  const expected = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex')

  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(parts.h1, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return expected === parts.h1
  }
}

export function readPaddleCustomData(data: Record<string, unknown> | undefined): {
  userId?: string
  planName?: string
} {
  const raw = data?.custom_data
  if (!raw || typeof raw !== 'object') return {}
  const record = raw as Record<string, unknown>
  return {
    userId: typeof record.userId === 'string' ? record.userId : undefined,
    planName: typeof record.planName === 'string' ? record.planName : undefined,
  }
}

export function readPaddleBillingPeriod(data: Record<string, unknown> | undefined): {
  start?: Date
  end?: Date
} {
  const period = data?.current_billing_period
  if (!period || typeof period !== 'object') return {}
  const record = period as Record<string, unknown>
  const startRaw = record.starts_at
  const endRaw = record.ends_at
  return {
    start: typeof startRaw === 'string' ? new Date(startRaw) : undefined,
    end: typeof endRaw === 'string' ? new Date(endRaw) : undefined,
  }
}
