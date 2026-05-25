import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./paymentOrders', () => ({
  getPaymentOrderByOutTradeNo: vi.fn(),
  markPaymentOrderPaid: vi.fn(),
}))

vi.mock('./subscriptionDb', () => ({
  upsertUserSubscription: vi.fn(),
}))

import { getPaymentOrderByOutTradeNo, markPaymentOrderPaid } from './paymentOrders'
import { upsertUserSubscription } from './subscriptionDb'
import { fulfillPaymentOrder } from './fulfillOrder'

describe('fulfillPaymentOrder idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns alreadyPaid when order is paid without re-upserting', async () => {
    vi.mocked(getPaymentOrderByOutTradeNo).mockResolvedValue({
      id: 'o1',
      userId: 'u1',
      planName: 'pro',
      outTradeNo: 'aide_1',
      status: 'paid',
      amountCents: 1900,
      channel: 'alipay',
      currency: 'CNY',
      tradeNo: 't1',
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    vi.mocked(upsertUserSubscription).mockResolvedValue({
      plan: { name: 'pro' },
    } as never)

    const result = await fulfillPaymentOrder('aide_1', 't1')
    expect(result.alreadyPaid).toBe(true)
    expect(markPaymentOrderPaid).not.toHaveBeenCalled()
    expect(upsertUserSubscription).toHaveBeenCalledWith('u1', 'pro')
  })
})
