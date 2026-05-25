import { describe, expect, it } from 'vitest'
import { resolveAgentModelId, serializeMessagesForApi } from './agentChatCompletion'
import type { ChatMessage } from './agentChatTypes'

describe('agentChatCompletion helpers', () => {
  it('maps legacy deepseek model ids to V4', () => {
    expect(
      resolveAgentModelId({
        provider: 'deepseek',
        apiKey: 'k',
        model: 'deepseek-chat',
      }),
    ).toBe('deepseek-v4-flash')
  })

  it('keeps deepseek-v4-pro as-is', () => {
    expect(
      resolveAgentModelId({
        provider: 'deepseek',
        apiKey: 'k',
        model: 'deepseek-v4-pro',
      }),
    ).toBe('deepseek-v4-pro')
  })

  it('serializes assistant tool_calls with reasoning_content', () => {
    const messages: ChatMessage[] = [
      {
        role: 'assistant',
        content: null,
        reasoning_content: 'plan step 1',
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'read_file', arguments: '{"path":"a.ts"}' },
          },
        ],
      },
      { role: 'tool', tool_call_id: 'call_1', content: 'ok' },
    ]
    const serialized = serializeMessagesForApi(messages)
    expect(serialized[0]).toMatchObject({
      role: 'assistant',
      reasoning_content: 'plan step 1',
      tool_calls: expect.any(Array),
    })
    expect(serialized[1]).toMatchObject({ role: 'tool', tool_call_id: 'call_1' })
  })
})
