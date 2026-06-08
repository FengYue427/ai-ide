import { describe, expect, it } from 'vitest'
import {
  isRepeatedToolCall,
  needsAgentFinalSummary,
  toolCallSignature,
} from './agentPromptShared'

describe('agentPromptShared', () => {
  it('detects when a final summary is needed', () => {
    expect(needsAgentFinalSummary(2, '')).toBe(true)
    expect(needsAgentFinalSummary(2, 'Done.')).toBe(false)
    expect(needsAgentFinalSummary(0, '')).toBe(false)
  })

  it('builds stable tool signatures', () => {
    expect(toolCallSignature('list_files', { glob: '*', max: 10 })).toBe(
      toolCallSignature('list_files', { max: 10, glob: '*' }),
    )
  })

  it('flags repeated identical tool calls', () => {
    const sig = toolCallSignature('list_files', {})
    expect(isRepeatedToolCall(sig, null, 0)).toEqual({ repeated: false, nextCount: 1 })
    expect(isRepeatedToolCall(sig, sig, 1)).toEqual({ repeated: true, nextCount: 2 })
  })
})
