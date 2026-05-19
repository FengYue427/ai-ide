import { AlipaySdk } from 'alipay-sdk'
import { readKeyFromEnv } from './cnPayment'

export const ALIPAY_GATEWAY_PRODUCTION = 'https://openapi.alipay.com/gateway.do'
export const ALIPAY_GATEWAY_SANDBOX = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'

export function resolveAlipayGateway(): string {
  const explicit = process.env.ALIPAY_GATEWAY?.trim()
  if (explicit) return explicit
  if (process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1') {
    return ALIPAY_GATEWAY_SANDBOX
  }
  return ALIPAY_GATEWAY_PRODUCTION
}

function getAlipaySdk(): AlipaySdk {
  const privateKey = readKeyFromEnv(
    process.env.ALIPAY_PRIVATE_KEY,
    process.env.ALIPAY_PRIVATE_KEY_PATH,
  )
  const alipayPublicKey = readKeyFromEnv(
    process.env.ALIPAY_PUBLIC_KEY,
    process.env.ALIPAY_PUBLIC_KEY_PATH,
  )

  return new AlipaySdk({
    appId: process.env.ALIPAY_APP_ID!.trim(),
    privateKey,
    alipayPublicKey,
    gateway: resolveAlipayGateway(),
    signType: 'RSA2',
  })
}

export async function createAlipayPageUrl(params: {
  outTradeNo: string
  totalAmountYuan: string
  subject: string
  returnUrl: string
  notifyUrl: string
}): Promise<string> {
  const sdk = getAlipaySdk()
  const url = sdk.pageExecute('alipay.trade.page.pay', 'GET', {
    bizContent: {
      out_trade_no: params.outTradeNo,
      total_amount: params.totalAmountYuan,
      subject: params.subject,
      product_code: 'FAST_INSTANT_TRADE_PAY',
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl,
  })

  if (!url || typeof url !== 'string') {
    throw new Error('支付宝未返回支付链接')
  }
  return url
}

export function verifyAlipayNotify(params: Record<string, string>): boolean {
  const sdk = getAlipaySdk()
  return sdk.checkNotifySign(params)
}
