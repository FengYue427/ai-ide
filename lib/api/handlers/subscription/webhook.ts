/**
 * Stripe webhook — sync Subscription rows with Stripe lifecycle events.
 */
import type Stripe from 'stripe'
import { errorResponse, jsonResponse } from '../../http'
import {
  downgradeUserToFree,
  markSubscriptionPastDueByStripeSubscriptionId,
  syncSubscriptionFromStripe,
  upsertUserSubscription,
} from '../../../billing/subscriptionDb'
import { constructStripeEvent, isStripeConfigured } from '../../../billing/stripe'

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (userId) {
    await downgradeUserToFree(userId)
    return
  }
  const { findSubscriptionByStripeId } = await import('../../../billing/subscriptionDb')
  const record = await findSubscriptionByStripeId(subscription.id)
  if (record) await downgradeUserToFree(record.userId)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const planName = session.metadata?.planName
  if (!userId || !planName) {
    console.warn('[Stripe webhook] checkout.session.completed missing metadata')
    return
  }

  await upsertUserSubscription(userId, planName, {
    customerId: typeof session.customer === 'string' ? session.customer : undefined,
    subscriptionId:
      typeof session.subscription === 'string' ? session.subscription : undefined,
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await syncSubscriptionFromStripe(subscription)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subRef = invoice.subscription
  const stripeSubscriptionId =
    typeof subRef === 'string' ? subRef : subRef?.id
  if (!stripeSubscriptionId) return
  await markSubscriptionPastDueByStripeSubscriptionId(stripeSubscriptionId)
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return errorResponse('Stripe 未配置', 501)
  }

  const signature = request.headers.get('stripe-signature')
  const payload = await request.text()

  try {
    const event = constructStripeEvent(payload, signature)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        break
    }

    return jsonResponse({ received: true })
  } catch (error) {
    console.error('[Stripe webhook] error:', error)
    return errorResponse('Webhook 校验失败', 400)
  }
}
