/**
 * 微信支付异步通知 — 解密后升级订阅
 */
import { fulfillPaymentOrder } from '../../../../billing/fulfillOrder'
import { isWechatPayConfigured } from '../../../../billing/cnPayment'
import { getWxPayVerifier } from '../../../../billing/wechatPay'

export async function POST(request: Request) {
  if (!isWechatPayConfigured()) {
    return new Response(JSON.stringify({ code: 'FAIL', message: 'not configured' }), { status: 501 })
  }

  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    const pay = getWxPayVerifier()

    const verified = await pay.verifySign({
      body,
      signature: headers['wechatpay-signature'] || headers['Wechatpay-Signature'] || '',
      serial: headers['wechatpay-serial'] || headers['Wechatpay-Serial'] || '',
      nonce: headers['wechatpay-nonce'] || headers['Wechatpay-Nonce'] || '',
      timestamp: headers['wechatpay-timestamp'] || headers['Wechatpay-Timestamp'] || '',
    })

    if (!verified) {
      console.error('[Wechat notify] verify failed')
      return new Response(JSON.stringify({ code: 'FAIL', message: 'sign' }), { status: 400 })
    }

    const payload = JSON.parse(body) as {
      resource?: { ciphertext?: string; nonce?: string; associated_data?: string }
    }

    const resource = payload.resource
    if (!resource?.ciphertext || !resource.nonce) {
      return new Response(JSON.stringify({ code: 'FAIL', message: 'resource' }), { status: 400 })
    }

    const decrypted = pay.decipher_gcm<string>(
      resource.ciphertext,
      resource.associated_data || '',
      resource.nonce,
      process.env.WECHAT_API_V3_KEY!,
    )

    const data = JSON.parse(typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted)) as {
      out_trade_no?: string
      transaction_id?: string
      trade_state?: string
    }

    if (data.trade_state === 'SUCCESS' && data.out_trade_no) {
      const result = await fulfillPaymentOrder(data.out_trade_no, data.transaction_id)
      if (result.alreadyPaid) {
        console.log('[Wechat notify] duplicate notify (already paid):', data.out_trade_no)
      }
    }

    return new Response(JSON.stringify({ code: 'SUCCESS', message: '成功' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Wechat notify] error:', error)
    return new Response(JSON.stringify({ code: 'FAIL', message: 'error' }), { status: 500 })
  }
}
