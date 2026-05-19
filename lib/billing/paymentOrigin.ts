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
export function resolvePaymentNotifyOrigin(req: Request): string {
  const override = process.env.PAYMENT_NOTIFY_URL?.trim()
  if (override) return override.replace(/\/$/, '')
  return resolveAppOrigin(req)
}
