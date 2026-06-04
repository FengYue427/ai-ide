import { describe, expect, it } from 'vitest'
import { estimateChatPayload, measureAiMessagesPayload } from './chatPayloadEstimate'

describe('chatPayloadEstimate', () => {
  it('measures serialized message bytes', () => {
    const size = measureAiMessagesPayload([
      { role: 'system', content: 'hello' },
      { role: 'user', content: 'world' },
    ])
    expect(size).toBeGreaterThan(20)
  })

  it('increases estimate when mention context is added', () => {
    const shared = {
      messages: [],
      provider: 'openai' as const,
      language: 'zh-CN' as const,
      agentMode: false,
      useWorkspaceContext: false,
      workspaceSelectedFiles: 0,
      currentCode: '',
      editorFiles: [{ name: 'a.ts', content: 'export const value = 1\n'.repeat(200) }],
      index: {
        builtAt: 1,
        files: [{ path: 'a.ts', language: 'typescript', symbols: [] }],
      },
      activeFilePath: null,
      applyProjectRules: (prompt: string) => prompt,
      defaultSystemPrompt: 'system',
    }

    const base = estimateChatPayload({ ...shared, draftText: 'plain question' })
    const withMention = estimateChatPayload({ ...shared, draftText: '@a.ts fix' })

    expect(withMention.estimatedBytes).toBeGreaterThan(base.estimatedBytes)
  })
})
