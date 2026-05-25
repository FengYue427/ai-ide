import { readFileSync } from 'node:fs'
import { normalizePemKey } from './pemKey'
import { resolvePaymentNotifyOrigin, resolvePaymentReturnOrigin } from './paymentOrigin'
import { findPlanByName, getPlanAmountCents } from './plans'
import { createPaymentOrder, type PaymentChannel } from './paymentOrders'
import { createAlipayPageFormHtml } from './alipayPay'
import { createWechatNativePay } from './wechatPay'

export function isAlipayConfigured(): boolean {
  return Boolean(
    process.env.ALIPAY_APP_ID?.trim() &&
      (process.env.ALIPAY_PRIVATE_KEY?.trim() || process.env.ALIPAY_PRIVATE_KEY_PATH?.trim()) &&
      (process.env.ALIPAY_PUBLIC_KEY?.trim() || process.env.ALIPAY_PUBLIC_KEY_PATH?.trim()),
  )
}

export function isWechatPayConfigured(): boolean {
  const hasPlatformCert = Boolean(
    process.env.WECHAT_PLATFORM_PUBLIC_KEY?.trim() || process.env.WECHAT_PLATFORM_PUBLIC_KEY_PATH?.trim(),
  )
  return Boolean(
    process.env.WECHAT_APP_ID?.trim() &&
      process.env.WECHAT_MCH_ID?.trim() &&
      process.env.WECHAT_API_V3_KEY?.trim() &&
      process.env.WECHAT_SERIAL_NO?.trim() &&
      (process.env.WECHAT_PRIVATE_KEY?.trim() || process.env.WECHAT_PRIVATE_KEY_PATH?.trim()) &&
      hasPlatformCert,
  )
}

export function isCnPaymentConfigured(): boolean {
  return isAlipayConfigured() || isWechatPayConfigured()
}

export function readKeyFromEnv(
  inlineKey: string | undefined,
  pathKey: string | undefined,
  pemType: string,
): string {
  let raw: string | undefined
  if (inlineKey?.trim()) {
    raw = inlineKey
  } else if (pathKey?.trim()) {
    raw = readFileSync(pathKey.trim(), 'utf8')
  }
  if (!raw) {
    throw new Error(`密钥未配置（需要 ${pemType}）`)
  }
  return normalizePemKey(raw, pemType)
}

export async function createCnCheckout(params: {
  req: Request
  userId: string
  planName: string
  channel: PaymentChannel
}) {
  const plan = findPlanByName(params.planName)
  if (!plan) throw new Error('无效的计划')

  const amountCents = getPlanAmountCents(params.planName)
  if (amountCents <= 0) throw new Error('该计划无需支付')

  const order = await createPaymentOrder({
    userId: params.userId,
    planName: params.planName,
    channel: params.channel,
    amountCents,
  })

  const returnOrigin = resolvePaymentReturnOrigin(params.req)
  const notifyOrigin = resolvePaymentNotifyOrigin(params.req)
  const subject = `AI IDE ${plan.displayName} 订阅`

  if (params.channel === 'alipay') {
    if (!isAlipayConfigured()) {
      throw new Error('支付宝未配置：请设置 ALIPAY_APP_ID、ALIPAY_PRIVATE_KEY、ALIPAY_PUBLIC_KEY')
    }
    const formHtml = createAlipayPageFormHtml({
      outTradeNo: order.outTradeNo,
      totalAmountYuan: (amountCents / 100).toFixed(2),
      subject,
      returnUrl: `${returnOrigin}/?subscription=success&plan=${params.planName}`,
      notifyUrl: `${notifyOrigin}/api/payment/alipay/notify`,
    })
    return { mode: 'alipay' as const, orderId: order.id, outTradeNo: order.outTradeNo, formHtml }
  }

  if (!isWechatPayConfigured()) {
    throw new Error('微信支付未配置：请设置 WECHAT_APP_ID、WECHAT_MCH_ID、WECHAT_API_V3_KEY、WECHAT_PRIVATE_KEY')
  }
  const { codeUrl } = await createWechatNativePay({
    outTradeNo: order.outTradeNo,
    amountCents,
    description: subject,
    notifyUrl: `${notifyOrigin}/api/payment/wechat/notify`,
  })

  return {
    mode: 'wechat' as const,
    orderId: order.id,
    outTradeNo: order.outTradeNo,
    codeUrl,
  }
}
