import { describe, expect, it } from 'vitest'
import { generateOutTradeNo } from './paymentOrders'

describe('paymentOrders', () => {
  it('generates unique out trade numbers', () => {
    const a = generateOutTradeNo()
    const b = generateOutTradeNo()
    expect(a).toMatch(/^aide_\d+_[a-f0-9]+$/)
    expect(b).not.toBe(a)
  })
})
