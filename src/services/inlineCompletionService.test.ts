import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearInlineCompletionCache, inlineCompletionService } from './inlineCompletionService'

vi.mock('./aiService', () => ({
  sendMessageWithDebounce: vi.fn(async () => 'line1\nline2\nline3'),
}))

vi.mock('./fimCompletionService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./fimCompletionService')>()
  return {
    ...actual,
    supportsFimApi: () => false,
    fetchFimCompletion: vi.fn(async () => null),
  }
})

import { sendMessageWithDebounce } from './aiService'

describe('inlineCompletionService', () => {
  beforeEach(() => {
    clearInlineCompletionCache()
    vi.mocked(sendMessageWithDebounce).mockReset()
    vi.mocked(sendMessageWithDebounce).mockResolvedValue('line1\nline2\nline3')
  })

  it('returns null without api key for cloud providers', async () => {
    const result = await inlineCompletionService.fetchCompletion({
      prefix: 'const x = ',
      suffix: '',
      language: 'javascript',
      filename: 'app.js',
      config: { provider: 'openai', apiKey: '' },
    })
    expect(result).toBeNull()
    expect(sendMessageWithDebounce).not.toHaveBeenCalled()
  })

  it('caches identical prefix/suffix requests', async () => {
    const config = { provider: 'openai' as const, apiKey: 'sk-test' }
    const req = {
      prefix: 'function hello() {\n  ',
      suffix: '\n}',
      language: 'typescript',
      filename: 'a.ts',
      config,
    }

    const first = await inlineCompletionService.fetchCompletion(req)
    const second = await inlineCompletionService.fetchCompletion(req)

    expect(first).toBe('line1\nline2\nline3')
    expect(second).toBe('line1\nline2\nline3')
    expect(sendMessageWithDebounce).toHaveBeenCalledTimes(1)
  })
})
