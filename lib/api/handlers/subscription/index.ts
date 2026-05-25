/**
 * Subscription status API — reads from DB when authenticated
 */
import { jsonResponse } from '../../http'
import { appendApiMessage } from '../../localizedError'
import { optionalAuth } from '../../requireAuth'
import { expireUserSubscriptionIfDue } from '../../../billing/subscriptionExpiry'
import { prisma } from '../../../../src/lib/prisma'

const freeSubscription = {
  plan: 'free',
  status: 'active',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
}

export async function GET(req: Request) {
  try {
    const user = await optionalAuth(req)
    if (!user) {
      return jsonResponse({ subscription: freeSubscription })
    }

    const { expired } = await expireUserSubscriptionIfDue(user.id)
    if (expired) {
      return jsonResponse(
        appendApiMessage(req, 'api.subscription.expired', {
          subscription: freeSubscription,
          notice: 'expired' as const,
        }),
      )
    }

    const record = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    })

    if (!record) {
      return jsonResponse({ subscription: freeSubscription })
    }

    return jsonResponse({
      subscription: {
        plan: record.plan.name,
        status: record.status,
        currentPeriodEnd: record.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      },
    })
  } catch (error) {
    console.error('[Subscription] Status error:', error)
    return jsonResponse({ subscription: freeSubscription })
  }
}
