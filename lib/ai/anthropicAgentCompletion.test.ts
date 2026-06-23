import { describe, expect, it } from 'vitest'
import {
  anthropicResponseToChatCompletion,
  chatMessagesToAnthropic,
  openAiToolsToAnthropic,
} from './anthropicAgentCompletion'
import type { ChatMessage } from '../../src/services/agentChatTypes'

describe('anthropicAgentCompletion', () => {
  it('converts OpenAI tools to Anthropic schema', () => {
    const tools = openAiToolsToAnthropic([
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read a file',
          parameters: { type: 'object', properties: { path: { type: 'string' } } },
        },
      },
    ])
    expect(tools[0]?.name).toBe('read_file')
    expect(tools[0]?.input_schema).toMatchObject({ type: 'object' })
  })

  it('converts assistant tool_calls and tool results', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are an agent.' },
      { role: 'user', content: 'Read a.ts' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'read_file', arguments: '{"path":"a.ts"}' },
          },
        ],
      },
      { role: 'tool', tool_call_id: 'call_1', content: 'export const x = 1' },
    ]

    const converted = chatMessagesToAnthropic(messages)
    expect(converted.system).toContain('You are an agent.')
    expect(converted.messages).toHaveLength(3)
    expect(converted.messages[1]?.role).toBe('assistant')
    expect(converted.messages[2]?.role).toBe('user')
  })

  it('maps Anthropic tool_use blocks to OpenAI tool_calls', () => {
    const result = anthropicResponseToChatCompletion({
      stop_reason: 'tool_use',
      content: [
        { type: 'tool_use', id: 'toolu_1', name: 'grep_repo', input: { query: 'foo' } },
      ],
    })
    expect(result.tool_calls?.[0]?.function.name).toBe('grep_repo')
    expect(result.finish_reason).toBe('tool_calls')
  })
})
