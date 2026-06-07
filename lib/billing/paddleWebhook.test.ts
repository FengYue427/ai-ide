import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'
import { verifyPaddleWebhookSignature } from './paddleWebhook'

describe('verifyPaddleWebhookSignature', () => {
  it('accepts valid h1 signature', () => {
    const secret = 'test_webhook_secret'
    const body = '{"event_type":"subscription.activated"}'
    const ts = '1700000000'
    const h1 = createHmac('sha256', secret).update(`${ts}:${body}`).digest('hex')
    expect(verifyPaddleWebhookSignature(body, `ts=${ts};h1=${h1}`, secret)).toBe(true)
  })

  it('rejects invalid signature', () => {
    expect(
      verifyPaddleWebhookSignature('{}', 'ts=1;h1=deadbeef', 'test_webhook_secret'),
    ).toBe(false)
  })
})
