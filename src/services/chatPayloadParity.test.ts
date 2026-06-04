import { describe, expect, it } from 'vitest'
import { estimateChatPayload, measureAiMessagesPayload } from './chatPayloadEstimate'
import {
  applyPayloadMeterReserve,
  CHAT_PAYLOAD_METER_RESERVE_BYTES,
  comparePayloadEstimateToSend,
} from './chatSendPreflight'
import { buildChatHistory } from './chatHistory'
import { buildMentionContextSection } from './mentionContextService'

describe('chatPayloadParity', () => {
  const shared = {
    messages: [{ role: 'user' as const, content: 'hello' }],
    provider: 'openai' as const,
    language: 'zh-CN' as const,
    agentMode: false,
    useWorkspaceContext: false,
    workspaceSelectedFiles: 0,
    currentCode: '',
    editorFiles: [{ name: 'a.ts', content: 'export const x = 1\n' }],
    index: {
      builtAt: 1,
      files: [
        {
          path: 'a.ts',
          language: 'typescript',
          symbols: [{ name: 'x', path: 'a.ts', line: 1, kind: 'const' as const }],
        },
      ],
    },
    activeFilePath: 'a.ts',
    applyProjectRules: (prompt: string) => prompt,
    defaultSystemPrompt: 'system base',
  }

  it('meter with reserve is within tolerance of sync send payload', () => {
    const draftText = 'explain @a.ts'
    const estimate = estimateChatPayload({ ...shared, draftText })
    const meter = applyPayloadMeterReserve(estimate)

    const history = buildChatHistory(shared.messages, 20)
    const mentionSection = buildMentionContextSection(
      draftText,
      shared.editorFiles,
      shared.index,
      shared.language,
    )
    const systemPrompt = mentionSection ? `${shared.defaultSystemPrompt}\n\n${mentionSection}` : shared.defaultSystemPrompt
    const sendMessages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: draftText },
    ]
    const sendBytes = measureAiMessagesPayload(sendMessages)

    expect(meter.estimatedBytes).toBeGreaterThanOrEqual(sendBytes)
    const parity = comparePayloadEstimateToSend(meter.estimatedBytes, sendBytes)
    if (sendBytes > meter.estimatedBytes) {
      expect(parity.withinTolerance).toBe(true)
    }
  })

  it('semantic reserve increases meter above bare sync send', () => {
    const base = estimateChatPayload({ ...shared, draftText: 'hi', useWorkspaceContext: true })
    const withSemantic = estimateChatPayload({
      ...shared,
      draftText: 'hi',
      useWorkspaceContext: true,
      semanticSearchEnabled: true,
    })
    expect(withSemantic.estimatedBytes).toBeGreaterThan(base.estimatedBytes)
    const meter = applyPayloadMeterReserve(withSemantic)
    expect(meter.estimatedBytes).toBeGreaterThanOrEqual(
      withSemantic.estimatedBytes + CHAT_PAYLOAD_METER_RESERVE_BYTES,
    )
  })
})
