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

export function getAlipaySdk(): AlipaySdk {
  let privateKey: string
  let alipayPublicKey: string
  try {
    privateKey = readKeyFromEnv(
      process.env.ALIPAY_PRIVATE_KEY,
      process.env.ALIPAY_PRIVATE_KEY_PATH,
      'RSA PRIVATE KEY',
    )
    alipayPublicKey = readKeyFromEnv(
      process.env.ALIPAY_PUBLIC_KEY,
      process.env.ALIPAY_PUBLIC_KEY_PATH,
      'PUBLIC KEY',
    )
  } catch (err) {
    const hint = err instanceof Error ? err.message : String(err)
    throw new Error(`支付宝密钥无效: ${hint}`)
  }

  return new AlipaySdk({
    appId: process.env.ALIPAY_APP_ID!.trim(),
    privateKey,
    alipayPublicKey,
    gateway: resolveAlipayGateway(),
    signType: 'RSA2',
  })
}

function buildPagePayParams(params: {
  outTradeNo: string
  totalAmountYuan: string
  subject: string
  returnUrl: string
  notifyUrl: string
}) {
  return {
    bizContent: {
      out_trade_no: params.outTradeNo,
      total_amount: params.totalAmountYuan,
      subject: params.subject,
      product_code: 'FAST_INSTANT_TRADE_PAY',
    },
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl,
  }
}

/** POST 表单 HTML（推荐：避免浏览器直接打开 gateway.do GET 白屏） */
export function createAlipayPageFormHtml(params: {
  outTradeNo: string
  totalAmountYuan: string
  subject: string
  returnUrl: string
  notifyUrl: string
}): string {
  const sdk = getAlipaySdk()
  const html = sdk.pageExecute('alipay.trade.page.pay', 'POST', buildPagePayParams(params))
  if (!html || typeof html !== 'string' || !html.includes('<form')) {
    throw new Error('支付宝未返回支付表单')
  }
  return html
}

/** GET 链接（诊断脚本用；前台请用 createAlipayPageFormHtml） */
export async function createAlipayPageUrl(params: {
  outTradeNo: string
  totalAmountYuan: string
  subject: string
  returnUrl: string
  notifyUrl: string
}): Promise<string> {
  const sdk = getAlipaySdk()
  const url = sdk.pageExecute('alipay.trade.page.pay', 'GET', buildPagePayParams(params))

  if (!url || typeof url !== 'string') {
    throw new Error('支付宝未返回支付链接')
  }
  return url
}

/** Query keys on return_url for our app — not included in Alipay signature. */
const APP_RETURN_QUERY_KEYS = new Set(['subscription', 'plan'])

export function parseAlipayReturnQuery(search: string): Record<string, string> {
  const q = search.startsWith('?') ? search.slice(1) : search
  const params: Record<string, string> = {}
  if (!q) return params
  for (const part of q.split('&')) {
    if (!part) continue
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = decodeURIComponent(part.slice(0, eq))
    const value = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, ' '))
    params[key] = value
  }
  return params
}

export function stripAppReturnQueryParams(params: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (APP_RETURN_QUERY_KEYS.has(key)) continue
    out[key] = value
  }
  return out
}

export function verifyAlipaySign(params: Record<string, string>): boolean {
  const sdk = getAlipaySdk()
  const signedOnly = stripAppReturnQueryParams(params)
  if (sdk.checkNotifySign(signedOnly)) return true
  try {
    return sdk.checkNotifySignV2(signedOnly)
  } catch {
    return false
  }
}

export function verifyAlipayNotify(params: Record<string, string>): boolean {
  return verifyAlipaySign(params)
}

export async function queryAlipayTrade(outTradeNo: string): Promise<{
  tradeStatus: string
  tradeNo?: string
}> {
  const sdk = getAlipaySdk()
  const raw = (await sdk.exec('alipay.trade.query', {
    bizContent: { out_trade_no: outTradeNo },
  })) as Record<string, unknown>

  const tradeStatus = String(raw.tradeStatus ?? raw.trade_status ?? '')
  const tradeNo =
    raw.tradeNo != null
      ? String(raw.tradeNo)
      : raw.trade_no != null
        ? String(raw.trade_no)
        : undefined
  return { tradeStatus, tradeNo }
}
