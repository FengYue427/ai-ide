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
    const gate = evaluateSendMentionGate(check, false)
    expect(gate.blocked).toBe(true)
    expect(gate.blockReason).toBe('unresolved')
    expect(evaluateSendMentionGate(check, true).blocked).toBe(false)
  })

  it('blocks send when symbol is ambiguous', () => {
    const index = {
      builtAt: 1,
      files: [
        {
          path: 'a.ts',
          language: 'typescript',
          symbols: [{ name: 'foo', path: 'a.ts', line: 1, kind: 'function' as const }],
        },
        {
          path: 'b.ts',
          language: 'typescript',
          symbols: [{ name: 'foo', path: 'b.ts', line: 2, kind: 'function' as const }],
        },
      ],
    }
    const editorFiles = [
      { name: 'a.ts', content: 'export function foo() {}\n' },
      { name: 'b.ts', content: 'export function foo() {}\n' },
    ]
    const check = runMentionPreflight('fix @foo', editorFiles, index)
    const gate = evaluateSendMentionGate(check, false)
    expect(gate.blocked).toBe(true)
    expect(gate.blockReason).toBe('ambiguous')
    expect(gate.ambiguousCount).toBe(1)
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
