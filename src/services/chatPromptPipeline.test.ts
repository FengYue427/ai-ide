import { describe, expect, it } from 'vitest'
import { buildPromptWithSharedContext } from './chatPromptPipeline'

describe('buildPromptWithSharedContext', () => {
  it('applies shared pipeline in stable order', async () => {
    const prompt = await buildPromptWithSharedContext({
      basePrompt: 'BASE',
      query: 'hello',
      forceSlim: false,
      applyProjectRules: (value) => `${value}|RULES`,
      augmentWithSemanticContext: async (value) => `${value}|SEMANTIC`,
      applyAgentContext: (value) => `${value}|AGENT`,
      buildMentionSection: () => 'MENTION',
    })

    expect(prompt).toBe('BASE|RULES|SEMANTIC|AGENT\n\nMENTION')
  })

  it('skips mention section in slim mode', async () => {
    const prompt = await buildPromptWithSharedContext({
      basePrompt: 'BASE',
      query: 'hello',
      forceSlim: true,
      applyProjectRules: (value) => `${value}|RULES`,
      augmentWithSemanticContext: async (value) => `${value}|SEMANTIC`,
      applyAgentContext: (value) => `${value}|AGENT`,
      buildMentionSection: () => 'MENTION',
    })

    expect(prompt).toBe('BASE|RULES|SEMANTIC|AGENT')
  })
})
