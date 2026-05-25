/**
 * Print production notify URLs for Alipay / WeChat merchant consoles.
 * Usage: node scripts/payment-notify-urls.mjs
 *        APP_URL=https://ai-ide-flame.vercel.app node scripts/payment-notify-urls.mjs
 */
const base = (process.env.APP_URL || process.env.AUTH_URL || 'https://ai-ide-flame.vercel.app').replace(
  /\/$/,
  '',
)

console.log('=== CN payment notify URLs ===\n')
console.log(`Base: ${base}\n`)
console.log('支付宝开放平台 → 异步通知:')
console.log(`  ${base}/api/payment/alipay/notify\n`)
console.log('微信支付商户平台 → 支付通知:')
console.log(`  ${base}/api/payment/wechat/notify\n`)
console.log('本地沙箱（notify 需公网 HTTPS，指向 dev:api 端口）:')
console.log('  ngrok http 3001')
console.log('  PAYMENT_NOTIFY_URL=https://<tunnel>.ngrok-free.app\n')
console.log('Docs: docs/CN_PAYMENT_SETUP.md · docs/PHASE4_CN_PAYMENT.md')
