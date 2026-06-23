import { describe, expect, it } from 'vitest'
import { chatMessagesToGemini, geminiResponseToChatCompletion } from './geminiAgentCompletion'
import type { ChatMessage } from '../../src/services/agentChatTypes'

describe('geminiAgentCompletion', () => {
  it('converts tool loop messages to Gemini contents', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Agent rules' },
      { role: 'user', content: 'Find foo' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'grep_repo', arguments: '{"query":"foo"}' },
          },
        ],
      },
      { role: 'tool', tool_call_id: 'call_1', content: 'src/a.ts:1: foo' },
    ]

    const converted = chatMessagesToGemini(messages)
    expect(converted.systemInstruction?.parts[0]?.text).toContain('Agent rules')
    expect(converted.contents).toHaveLength(3)
    expect(converted.contents[1]?.parts[0]).toMatchObject({
      functionCall: { name: 'grep_repo' },
    })
    expect(converted.contents[2]?.parts[0]).toMatchObject({
      functionResponse: { name: 'grep_repo' },
    })
  })

  it('maps Gemini functionCall parts to OpenAI tool_calls', () => {
    const result = geminiResponseToChatCompletion({
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [{ functionCall: { name: 'list_files', args: { glob: '*.ts' } } }],
          },
        },
      ],
    })
    expect(result.tool_calls?.[0]?.function.name).toBe('list_files')
    expect(result.finish_reason).toBe('tool_calls')
  })
})
