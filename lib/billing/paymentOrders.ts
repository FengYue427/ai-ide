import { prisma } from '../../src/lib/prisma'
import { randomBytes } from 'crypto'

export type PaymentChannel = 'alipay' | 'wechat'
export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'closed'

export function generateOutTradeNo(): string {
  return `aide_${Date.now()}_${randomBytes(4).toString('hex')}`
}

export async function createPaymentOrder(params: {
  userId: string
  planName: string
  channel: PaymentChannel
  amountCents: number
}) {
  return prisma.paymentOrder.create({
    data: {
      userId: params.userId,
      planName: params.planName,
      channel: params.channel,
      outTradeNo: generateOutTradeNo(),
      amountCents: params.amountCents,
      currency: 'CNY',
      status: 'pending',
    },
  })
}

export async function getPaymentOrderByOutTradeNo(outTradeNo: string) {
  return prisma.paymentOrder.findUnique({ where: { outTradeNo } })
}

export async function getPaymentOrderById(id: string) {
  return prisma.paymentOrder.findUnique({ where: { id } })
}

/** Returns true if transitioned pending → paid (false if already paid or missing). */
export async function markPaymentOrderPaid(outTradeNo: string, tradeNo?: string): Promise<boolean> {
  const result = await prisma.paymentOrder.updateMany({
    where: { outTradeNo, status: 'pending' },
    data: {
      status: 'paid',
      tradeNo: tradeNo ?? undefined,
      paidAt: new Date(),
    },
  })
  return result.count > 0
}

export async function closePaymentOrder(outTradeNo: string) {
  return prisma.paymentOrder.updateMany({
    where: { outTradeNo, status: 'pending' },
    data: { status: 'closed' },
  })
}
