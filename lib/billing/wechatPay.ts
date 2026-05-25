import WxPay from 'wechatpay-node-v3'
import { readKeyFromEnv } from './cnPayment'

function getWxPay(): InstanceType<typeof WxPay> {
  const privateKey = Buffer.from(
    readKeyFromEnv(process.env.WECHAT_PRIVATE_KEY, process.env.WECHAT_PRIVATE_KEY_PATH, 'PRIVATE KEY'),
    'utf8',
  )

  const platformInline = process.env.WECHAT_PLATFORM_PUBLIC_KEY?.trim()
  const platformPath = process.env.WECHAT_PLATFORM_PUBLIC_KEY_PATH?.trim()
  if (!platformInline && !platformPath) {
    throw new Error(
      '微信支付缺少平台证书公钥：请设置 WECHAT_PLATFORM_PUBLIC_KEY 或 WECHAT_PLATFORM_PUBLIC_KEY_PATH（商户平台 → API 安全 → 平台证书）',
    )
  }
  const publicKeyPem = readKeyFromEnv(platformInline, platformPath, 'CERTIFICATE')

  return new WxPay({
    appid: process.env.WECHAT_APP_ID!.trim(),
    mchid: process.env.WECHAT_MCH_ID!.trim(),
    publicKey: Buffer.from(publicKeyPem, 'utf8'),
    privateKey,
    key: process.env.WECHAT_API_V3_KEY!.trim(),
    serial_no: process.env.WECHAT_SERIAL_NO?.trim(),
  })
}

export async function createWechatNativePay(params: {
  outTradeNo: string
  amountCents: number
  description: string
  notifyUrl: string
}): Promise<{ codeUrl: string }> {
  const pay = getWxPay()

  const result = (await pay.transactions_native({
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: {
      total: params.amountCents,
      currency: 'CNY',
    },
  })) as { code_url?: string; data?: { code_url?: string } }

  const codeUrl = result.code_url || result.data?.code_url

  if (!codeUrl) {
    throw new Error('微信未返回支付二维码链接')
  }

  return { codeUrl }
}

export async function queryWechatTrade(outTradeNo: string): Promise<{
  tradeState: string
  transactionId?: string
}> {
  const pay = getWxPay()
  const result = (await pay.query({ out_trade_no: outTradeNo })) as {
    trade_state?: string
    transaction_id?: string
    data?: { trade_state?: string; transaction_id?: string }
  }

  const tradeState = result.trade_state || result.data?.trade_state || ''
  const transactionId = result.transaction_id || result.data?.transaction_id

  return { tradeState, transactionId }
}

export function getWxPayVerifier() {
  return getWxPay()
}
