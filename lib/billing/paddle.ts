import { getPaddlePriceId } from './plans'
import { buildAppReturnUrl } from './returnUrl'
import { resolveAppOrigin } from './stripe'

export type PaddleApiMode = 'sandbox' | 'live'

export function isPaddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY?.trim())
}

export function resolvePaddleApiMode(): PaddleApiMode {
  const explicit = process.env.PADDLE_ENV?.trim().toLowerCase()
  if (explicit === 'sandbox' || explicit === 'sdbx') return 'sandbox'
  if (explicit === 'live' || explicit === 'production') return 'live'
  const key = process.env.PADDLE_API_KEY?.trim() ?? ''
  if (key.includes('_sdbx_') || key.startsWith('pdl_sdbx')) return 'sandbox'
  return 'live'
}

export function resolvePaddleApiBase(): string {
  return resolvePaddleApiMode() === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com'
}

function getPaddleApiKey(): string {
  const key = process.env.PADDLE_API_KEY?.trim()
  if (!key) throw new Error('PADDLE_API_KEY is not configured')
  return key
}

type PaddleEnvelope<T> = {
  data?: T
  error?: { detail?: string; type?: string }
}

async function paddleRequest<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(`${resolvePaddleApiBase()}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${getPaddleApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: init?.body != null ? JSON.stringify(init.body) : undefined,
  })

  const json = (await response.json().catch(() => ({}))) as PaddleEnvelope<T>
  if (!response.ok) {
    const detail = json.error?.detail ?? json.error?.type ?? response.statusText
    throw new Error(`Paddle API ${response.status}: ${detail}`)
  }
  if (json.data == null) {
    throw new Error('Paddle API returned empty data')
  }
  return json.data
}

export async function createPaddleCheckoutSession(params: {
  req: Request
  userId: string
  email: string
  planName: string
  desktopShell?: boolean
}): Promise<string> {
  const priceId = getPaddlePriceId(params.planName)
  if (!priceId) {
    throw new Error(`未配置 Paddle Price ID（PADDLE_PRICE_${params.planName.toUpperCase()}）`)
  }

  const origin = resolveAppOrigin(params.req)
  const successUrl = buildAppReturnUrl(
    origin,
    { subscription: 'success', plan: params.planName },
    { desktopShell: params.desktopShell },
  )

  const data = await paddleRequest<{ checkout?: { url?: string } }>('/transactions', {
    method: 'POST',
    body: {
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: {
        userId: params.userId,
        planName: params.planName,
      },
      customer: { email: params.email },
      collection_mode: 'automatic',
      checkout: { url: successUrl },
    },
  })

  const url = data.checkout?.url
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Paddle 未返回 checkout URL')
  }
  return url
}

export async function cancelPaddleSubscriptionAtPeriodEnd(subscriptionId: string): Promise<void> {
  await paddleRequest(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: { effective_from: 'next_billing_period' },
  })
}

export async function cancelPaddleSubscriptionImmediately(subscriptionId: string): Promise<void> {
  await paddleRequest(`/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: { effective_from: 'immediately' },
  })
}

export async function createPaddleCustomerPortalSession(params: {
  req: Request
  customerId: string
  subscriptionId?: string | null
  desktopShell?: boolean
}): Promise<string> {
  const origin = resolveAppOrigin(params.req)
  const body: Record<string, unknown> = {
    return_url: buildAppReturnUrl(origin, { subscription: 'portal' }, { desktopShell: params.desktopShell }),
  }
  if (params.subscriptionId) {
    body.subscription_ids = [params.subscriptionId]
  }

  const data = await paddleRequest<{ urls?: { general?: { overview?: string } } }>(
    `/customers/${params.customerId}/portal-sessions`,
    { method: 'POST', body },
  )

  const url = data.urls?.general?.overview
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('Paddle 未返回客户门户 URL')
  }
  return url
}
