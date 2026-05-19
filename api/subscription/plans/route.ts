/**
 * Subscription plans — DB-backed when available, static fallback otherwise.
 */
import { jsonResponse } from '../../../lib/api/http'
import { BILLING_PLANS } from '../../../lib/billing/plans'
import { ensurePlansSeeded } from '../../../lib/billing/subscriptionDb'
import { prisma } from '../../../src/lib/prisma'

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export async function GET() {
  try {
    await ensurePlansSeeded()
    const records = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    })

    if (records.length > 0) {
      const plans = records.map((plan) => ({
        id: plan.name,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description ?? '',
        price: plan.price,
        currency: plan.currency,
        features: parseJsonField<string[]>(plan.features, []),
        limits: parseJsonField(plan.limits, BILLING_PLANS[0].limits),
      }))
      return jsonResponse({ plans })
    }
  } catch (error) {
    console.warn('[Plans] DB unavailable, using static plans:', error)
  }

  return jsonResponse({ plans: BILLING_PLANS })
}
