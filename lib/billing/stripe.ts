import Stripe from 'stripe'
import { getStripePriceId } from './plans'
import { buildAppReturnUrl } from './returnUrl'

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key)
}

export function resolveAppOrigin(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  if (host) return `${proto}://${host}`.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export async function createStripeCheckoutSession(params: {
  req: Request
  userId: string
  email: string
  planName: string
  stripeCustomerId?: string | null
  desktopShell?: boolean
}): Promise<string> {
  const priceId = getStripePriceId(params.planName)
  if (!priceId) {
    throw new Error(`未配置 Stripe 价格 ID（STRIPE_PRICE_${params.planName.toUpperCase()}）`)
  }

  const origin = resolveAppOrigin(params.req)
  const stripe = getStripeClient()

  const customerField = params.stripeCustomerId
    ? { customer: params.stripeCustomerId }
    : { customer_email: params.email }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...customerField,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: buildAppReturnUrl(
      origin,
      { subscription: 'success', plan: params.planName },
      { desktopShell: params.desktopShell },
    ),
    cancel_url: buildAppReturnUrl(origin, { subscription: 'canceled' }, { desktopShell: params.desktopShell }),
    metadata: {
      userId: params.userId,
      planName: params.planName,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        planName: params.planName,
      },
    },
  })

  if (!session.url) {
    throw new Error('Stripe 未返回 checkout URL')
  }

  return session.url
}

export async function resumeStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  })
}

export async function cancelStripeSubscriptionAtPeriodEnd(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function cancelStripeSubscriptionImmediately(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptions.cancel(stripeSubscriptionId)
}

export async function createStripeBillingPortalSession(params: {
  req: Request
  customerId: string
  desktopShell?: boolean
}): Promise<string> {
  const stripe = getStripeClient()
  const origin = resolveAppOrigin(params.req)
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: buildAppReturnUrl(
      origin,
      { subscription: 'portal_return' },
      { desktopShell: params.desktopShell },
    ),
  })
  if (!session.url) {
    throw new Error('Stripe 未返回客户门户 URL')
  }
  return session.url
}

export function constructStripeEvent(payload: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature ?? '', secret)
}
