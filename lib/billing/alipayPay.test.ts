import { describe, expect, it } from 'vitest'
import { parseAlipayReturnQuery, stripAppReturnQueryParams } from './alipayPay'

describe('alipay return query', () => {
  it('strips app-only params before sign verify', () => {
    const all = {
      subscription: 'success',
      plan: 'pro',
      charset: 'utf-8',
      out_trade_no: 'aide_1',
      method: 'alipay.trade.page.pay.return',
      total_amount: '19.00',
      sign: 'abc',
      sign_type: 'RSA2',
    }
    const stripped = stripAppReturnQueryParams(all)
    expect(stripped.subscription).toBeUndefined()
    expect(stripped.plan).toBeUndefined()
    expect(stripped.out_trade_no).toBe('aide_1')
  })

  it('parses combined return query string', () => {
    const parsed = parseAlipayReturnQuery(
      '?subscription=success&plan=pro&charset=utf-8&out_trade_no=aide_x&method=alipay.trade.page.pay.return&total_amount=19.00',
    )
    expect(parsed.plan).toBe('pro')
    expect(parsed.out_trade_no).toBe('aide_x')
  })
})
