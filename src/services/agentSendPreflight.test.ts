import { describe, expect, it } from 'vitest'
import {
  buildAgentSendSlimPlan,
  evaluateAgentSendPreflight,
  evaluateBuiltMessagesPreflight,
  evaluateMeterPayloadPreflight,
} from './agentSendPreflight'
import { evaluateSendMentionGate } from './chatSendPreflight'
import { runMentionPreflight } from './mentionPreflight'

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key

describe('agentSendPreflight', () => {
  it('blocks unresolved mentions before payload check', () => {
    const mentionCheck = runMentionPreflight('fix @missing.ts', [], { builtAt: 1, files: [] })
    const gate = evaluateSendMentionGate(mentionCheck, false)
    const result = evaluateAgentSendPreflight({
      mentionGate: gate,
      meterEstimate: {
        estimatedBytes: 99_999,
        budgetBytes: 50_000,
        level: 'over',
        usagePercent: 100,
      },
      draftText: 'fix @missing.ts',
      slimPlan: buildAgentSendSlimPlan(t, 20),
      forceSlim: false,
    })
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toBe('mention_unresolved')
    expect(result.payloadWarning).toBeNull()
  })

  it('blocks when meter estimate exceeds budget', () => {
    const gate = evaluateSendMentionGate(runMentionPreflight('hello', [], { builtAt: 1, files: [] }), false)
    const result = evaluateAgentSendPreflight({
      mentionGate: gate,
      meterEstimate: {
        estimatedBytes: 60_000,
        budgetBytes: 50_000,
        level: 'over',
        usagePercent: 100,
      },
      draftText: 'hello',
      slimPlan: buildAgentSendSlimPlan(t, 20, { agentMode: true }),
      forceSlim: false,
    })
    expect(result.blocked).toBe(true)
    expect(result.blockReason).toBe('payload_over_budget')
    expect(result.payloadWarning?.estimatedBytes).toBe(60_000)
  })

  it('skips meter payload block when forceSlim', () => {
    const gate = evaluateSendMentionGate(runMentionPreflight('hello', [], { builtAt: 1, files: [] }), false)
    const result = evaluateAgentSendPreflight({
      mentionGate: gate,
      meterEstimate: {
        estimatedBytes: 60_000,
        budgetBytes: 50_000,
        level: 'over',
        usagePercent: 100,
      },
      draftText: 'hello',
      slimPlan: buildAgentSendSlimPlan(t, 6),
      forceSlim: true,
    })
    expect(result.blocked).toBe(false)
    expect(evaluateMeterPayloadPreflight({
      meterEstimate: { estimatedBytes: 60_000, budgetBytes: 50_000, level: 'over', usagePercent: 100 },
      draftText: 'hello',
      slimPlan: [],
      forceSlim: true,
    })).toBeNull()
  })

  it('flags built agent tool messages over budget', () => {
    const messages = [
      { role: 'system', content: 'x'.repeat(130_000) },
      { role: 'user', content: 'goal' },
    ]
    const warning = evaluateBuiltMessagesPreflight({
      messages,
      provider: 'openai',
      draftText: 'goal',
      slimPlan: buildAgentSendSlimPlan(t, 20),
      forceSlim: false,
    })
    expect(warning).not.toBeNull()
    expect(warning!.estimatedBytes).toBeGreaterThan(warning!.budgetBytes)
  })
})
