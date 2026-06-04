import { describe, expect, it } from 'vitest'
import {
  applyPayloadMeterReserve,
  CHAT_PAYLOAD_METER_RESERVE_BYTES,
  comparePayloadEstimateToSend,
  evaluateSendMentionGate,
} from './chatSendPreflight'
import { runMentionPreflight } from './mentionPreflight'

describe('chatSendPreflight', () => {
  it('blocks send when mentions are unresolved', () => {
    const check = runMentionPreflight('fix @missing.ts', [], { builtAt: 1, files: [] })
    expect(evaluateSendMentionGate(check, false).blocked).toBe(true)
    expect(evaluateSendMentionGate(check, true).blocked).toBe(false)
  })

  it('adds reserve bytes to meter estimate', () => {
    const adjusted = applyPayloadMeterReserve({
      estimatedBytes: 1000,
      budgetBytes: 50_000,
      level: 'ok',
      usagePercent: 2,
    })
    expect(adjusted.estimatedBytes).toBe(1000 + CHAT_PAYLOAD_METER_RESERVE_BYTES)
    expect(adjusted.usagePercent).toBeGreaterThan(2)
  })

  it('flags large estimate vs send drift', () => {
    const parity = comparePayloadEstimateToSend(10_000, 20_000)
    expect(parity.withinTolerance).toBe(false)
    expect(parity.deltaBytes).toBe(10_000)
  })
})
