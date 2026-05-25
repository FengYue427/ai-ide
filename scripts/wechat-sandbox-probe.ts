/**
 * Diagnose WeChat Native pay config (keys, notify URL, code_url).
 * Usage: npx tsx scripts/wechat-sandbox-probe.ts
 */
import { loadEnvLocal } from './load-env-local.mjs'
import { isWechatPayConfigured } from '../lib/billing/cnPayment'
import { createWechatNativePay } from '../lib/billing/wechatPay'
import { resolvePaymentNotifyOrigin } from '../lib/billing/paymentOrigin'

loadEnvLocal()

async function main() {
  if (!isWechatPayConfigured()) {
    console.error('❌ 微信未配置齐 — 见 docs/WECHAT_SANDBOX_QUICKSTART.md')
    process.exit(1)
  }

  const fakeReq = new Request('http://localhost:3000/')
  let notifyOrigin: string
  try {
    notifyOrigin = resolvePaymentNotifyOrigin(fakeReq)
  } catch (e) {
    console.error('❌', e instanceof Error ? e.message : e)
    process.exit(1)
  }

  const notifyUrl = `${notifyOrigin}/api/payment/wechat/notify`

  console.log('=== WeChat Native probe ===\n')
  console.log('appId:', process.env.WECHAT_APP_ID?.trim())
  console.log('mchId:', process.env.WECHAT_MCH_ID?.trim())
  console.log('serial:', process.env.WECHAT_SERIAL_NO?.trim())
  console.log('notify_url:', notifyUrl)

  const healthUrl = `${notifyOrigin}/api/health`
  try {
    const ping = await fetch(healthUrl, { method: 'GET', redirect: 'manual' })
    console.log(`API 可达: ${healthUrl} → HTTP ${ping.status}`)
  } catch {
    console.log('API: ❌ 无法连接 — 请 ngrok http 3001 + npm run dev:stack')
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(notifyUrl)) {
    console.log('\n⚠️  notify_url 使用 localhost，微信无法回调')
  }

  try {
    const { codeUrl } = await createWechatNativePay({
      outTradeNo: `probe_${Date.now()}`,
      amountCents: 1,
      description: 'AI IDE probe',
      notifyUrl,
    })
    console.log('\n✅ Native 下单成功，code_url 前缀:', codeUrl.slice(0, 60) + '...')
    console.log('   可在订阅弹窗用「微信」走真实流程；本 probe 订单可忽略未付。')
  } catch (e) {
    console.error('\n❌ Native 下单失败:')
    console.error(e instanceof Error ? e.message : e)
    console.log('\n常见原因:')
    console.log('  1) 商户 API 证书序列号与私钥不匹配')
    console.log('  2) 用了商户公钥而非「平台证书」作为 WECHAT_PLATFORM_PUBLIC_KEY')
    console.log('  3) AppID 未与商户号关联')
    console.log('  4) Native 产品未开通')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
