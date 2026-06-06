import { describe, expect, it } from 'vitest'
import { formatAlipayTotalAmountYuan } from './cnPriceVerify'
import { parseAlipayReturnQuery } from './alipayPay'

describe('alipay notify/return amount', () => {
  it('return query total_amount matches checkout catalog for Pro', () => {
    const expected = formatAlipayTotalAmountYuan('pro')
    const parsed = parseAlipayReturnQuery('?total_amount=39.00&out_trade_no=aide_test')
    expect(parsed.total_amount).toBe(expected)
  })
})
