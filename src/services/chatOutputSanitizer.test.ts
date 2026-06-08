import { describe, expect, it } from 'vitest'
import { extractUserFacingStreamDelta, sanitizeChatAssistantOutput } from './chatOutputSanitizer'

describe('chatOutputSanitizer', () => {
  it('removes think tags and thinking sections', () => {
    const raw =
      '<' + 'think' + '>\ninternal chain\n</' + 'think' + '>\n\n## 目标\nVisible answer'
    expect(sanitizeChatAssistantOutput(raw)).toBe('## 目标\nVisible answer')
  })

  it('removes markdown thinking section', () => {
    const raw = `## 思考过程
step 1
step 2

## 小结
Done.`
    expect(sanitizeChatAssistantOutput(raw)).toBe('## 小结\nDone.')
  })

  it('ignores reasoning_content in stream delta', () => {
    expect(
      extractUserFacingStreamDelta({
        content: 'hello',
        reasoning_content: 'secret',
      }),
    ).toBe('hello')
    expect(
      extractUserFacingStreamDelta({
        reasoning_content: 'only reasoning',
      }),
    ).toBe('')
  })
})
