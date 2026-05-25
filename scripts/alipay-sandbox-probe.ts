/**
 * Diagnose Alipay sandbox page-pay URL (signature / notify_url / gateway).
 * Usage: npx tsx scripts/alipay-sandbox-probe.ts
 */
import { loadEnvLocal } from './load-env-local.mjs'
import { createAlipayPageUrl, resolveAlipayGateway } from '../lib/billing/alipayPay'
import { resolvePaymentNotifyOrigin } from '../lib/billing/paymentOrigin'

loadEnvLocal()

async function main() {
  const appId = process.env.ALIPAY_APP_ID?.trim()
  if (!appId) {
    console.error('❌ ALIPAY_APP_ID 未设置')
    process.exit(1)
  }

  const gateway = resolveAlipayGateway()
  const fakeReq = new Request('http://localhost:3000/')
  let notifyOrigin: string
  try {
    notifyOrigin = resolvePaymentNotifyOrigin(fakeReq)
  } catch (e) {
    console.error('❌', e instanceof Error ? e.message : e)
    process.exit(1)
  }

  console.log('=== Alipay sandbox probe ===\n')
  console.log('appId:', appId)
  console.log('gateway:', gateway)
  console.log('notify base:', notifyOrigin)

  const returnUrl = `${process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:3000'}/?subscription=success&plan=pro`
  const notifyUrl = `${notifyOrigin}/api/payment/alipay/notify`
  console.log('return_url:', returnUrl)
  console.log('notify_url:', notifyUrl)

  const healthUrl = `${notifyOrigin}/api/health`
  try {
    const ping = await fetch(healthUrl, { method: 'GET', redirect: 'manual' })
    if (ping.ok) {
      console.log(`本机 API 可达: ${healthUrl} → HTTP ${ping.status}（请先 npm run dev:stack）`)
    } else {
      console.log(`本机 API 响应: ${healthUrl} → HTTP ${ping.status}（隧道通，但请确认 dev:stack 正常）`)
    }
  } catch {
    console.log(
      '本机 API: ❌ 无法连接 — 请同时运行: ① ngrok http 3001  ② npm run dev:stack（否则 notify 会 502）',
    )
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(notifyUrl)) {
    console.log('\n⚠️  notify_url 使用 localhost，沙箱常会直接跳转 /error')
    console.log('   请: ngrok http 3001 → PAYMENT_NOTIFY_URL=https://xxx.ngrok-free.app\n')
  }

  const url = await createAlipayPageUrl({
    outTradeNo: `probe_${Date.now()}`,
    totalAmountYuan: '0.01',
    subject: 'AI IDE probe',
    returnUrl,
    notifyUrl,
  })

  console.log('\nGenerated URL (first 120 chars):')
  console.log(url.slice(0, 120) + '...\n')

  const res = await fetch(url, { method: 'GET', redirect: 'manual' })
  console.log('HTTP status:', res.status)
  const loc = res.headers.get('location')
  if (loc) console.log('Location:', loc.slice(0, 220))

  let body = await res.text()
  if (loc?.includes('/error') && loc.startsWith('http')) {
    try {
      const errPage = await fetch(loc, { redirect: 'follow' })
      body += await errPage.text()
    } catch {
      // ignore
    }
  }
  const subCode = body.match(/sub_code["\s:]+([^"<&]+)/i)?.[1]
  const subMsg = body.match(/sub_msg["\s:]+([^"<&]+)/i)?.[1]
  const errMsg = body.match(/error_msg["\s:]+([^"<&]+)/i)?.[1]
  if (subCode || subMsg || errMsg) {
    console.log('\n支付宝错误:')
    if (subCode) console.log('  sub_code:', subCode)
    if (subMsg) console.log('  sub_msg:', subMsg)
    if (errMsg) console.log('  error_msg:', errMsg)
  } else if (body.includes('/error') || loc?.includes('/error')) {
    console.log('\n⚠️  网关返回 error 页。常见原因:')
    console.log('  1) ngrok 未运行或 PAYMENT_NOTIFY_URL 与当前 ngrok 窗口域名不一致')
    console.log('  2) 应用私钥 + 支付宝公钥须成对来自沙箱「系统默认密钥」（勿混用应用公钥）')
    console.log('  3) 修改 .env.local 后未重启 dev:stack')
    console.log('  4) 沙箱应用未开通「电脑网站支付」')
    console.log('\n建议: 保持 ngrok 窗口 Online → 再执行 npm run billing:alipay-probe')
  } else {
    console.log('\n✅ 网关未直接返回 error（可继续在浏览器打开完整 URL 测登录）')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
