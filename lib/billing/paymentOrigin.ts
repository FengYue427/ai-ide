import { resolveAppOrigin } from './stripe'

/**
 * User-facing return URL (browser redirect after Alipay).
 * Uses APP_URL or request host — typically https://your-domain or http://localhost:3000
 */
export function resolvePaymentReturnOrigin(req: Request): string {
  return resolveAppOrigin(req)
}

/**
 * Server-to-server notify URL base (Alipay / WeChat callbacks).
 * Production: same as APP_URL.
 * Local: set PAYMENT_NOTIFY_URL to your ngrok/cloudflared HTTPS origin (API must be reachable).
 */
function isLocalNotifyOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin.replace(/\/$/, ''))
}

export function resolvePaymentNotifyOrigin(req: Request): string {
  const override = process.env.PAYMENT_NOTIFY_URL?.trim()
  if (override) return override.replace(/\/$/, '')

  const origin = resolveAppOrigin(req)
  const sandbox = process.env.ALIPAY_SANDBOX === 'true' || process.env.ALIPAY_SANDBOX === '1'

  if (sandbox && isLocalNotifyOrigin(origin)) {
    const fallback = process.env.ALIPAY_SANDBOX_NOTIFY_FALLBACK?.trim()
    if (fallback) return fallback.replace(/\/$/, '')

    throw new Error(
      '支付宝沙箱不接受 localhost 作为 notify_url。请运行 ngrok http 3001，在 .env.local 设置 PAYMENT_NOTIFY_URL=https://你的隧道域名，然后重启 dev:stack。',
    )
  }

  return origin
}
