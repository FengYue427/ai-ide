/**
 * Paddle Billing webhook — sync Subscription rows with Paddle lifecycle events.
 */
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { isPaddleConfigured } from '../../../billing/paddle'
import { verifyPaddleWebhookSignature } from '../../../billing/paddleWebhook'
import { syncSubscriptionFromPaddle } from '../../../billing/subscriptionDb'

const HANDLED_EVENTS = new Set([
  'subscription.activated',
  'subscription.updated',
  'subscription.canceled',
  'subscription.past_due',
  'transaction.completed',
])

export async function POST(request: Request) {
  if (!isPaddleConfigured()) {
    return localizedErrorResponse(request, 'api.subscription.paddleNotConfigured', 501)
  }

  const payload = await request.text()
  const signature = request.headers.get('paddle-signature')

  if (!verifyPaddleWebhookSignature(payload, signature)) {
    console.error('[Paddle webhook] invalid signature')
    return localizedErrorResponse(request, 'api.subscription.webhookFailed', 400)
  }

  try {
    const event = JSON.parse(payload) as {
      event_type?: string
      data?: Record<string, unknown>
    }

    const eventType = event.event_type ?? ''
    if (!HANDLED_EVENTS.has(eventType)) {
      return jsonResponse({ received: true, ignored: eventType })
    }

    const data = event.data
    if (!data) {
      return jsonResponse({ received: true })
    }

    if (eventType === 'subscription.canceled') {
      await syncSubscriptionFromPaddle(data)
      return jsonResponse({ received: true })
    }

    if (eventType.startsWith('subscription.')) {
      await syncSubscriptionFromPaddle(data)
      return jsonResponse({ received: true })
    }

    if (eventType === 'transaction.completed') {
      const subscriptionId = data.subscription_id
      if (typeof subscriptionId === 'string' && subscriptionId) {
        // transaction.completed may arrive before subscription.* — custom_data still on transaction
        await syncSubscriptionFromPaddle({
          id: subscriptionId,
          customer_id: data.customer_id,
          custom_data: data.custom_data,
          status: 'active',
          current_billing_period: data.billing_period,
        })
      }
    }

    return jsonResponse({ received: true })
  } catch (error) {
    console.error('[Paddle webhook] error:', error)
    return localizedErrorResponse(request, 'api.subscription.webhookFailed', 500)
  }
}
