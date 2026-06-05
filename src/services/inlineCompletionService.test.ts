import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildTabCompletionCacheKey,
  clearInlineCompletionCache,
  getTabCompletionMetrics,
  inlineCompletionService,
  resetTabCompletionMetrics,
} from './inlineCompletionService'

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

vi.mock('./platformAiService', () => ({
  fetchPlatformTabCompletion: vi.fn(async () => 'platform-line'),
}))

vi.mock('../lib/aiPlatformMode', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/aiPlatformMode')>()
  return {
    ...actual,
    isAiConfigured: (config: { apiKey?: string; provider?: string }, loggedIn: boolean) =>
      Boolean(config.apiKey?.trim()) || loggedIn,
    shouldUsePlatformAi: (config: { keyMode?: string }, loggedIn: boolean) =>
      loggedIn && config.keyMode === 'platform',
  }
})

import { sendMessageWithDebounce } from './aiService'
import { fetchPlatformTabCompletion } from './platformAiService'

describe('inlineCompletionService', () => {
  beforeEach(() => {
    clearInlineCompletionCache()
    resetTabCompletionMetrics()
    vi.mocked(sendMessageWithDebounce).mockReset()
    vi.mocked(sendMessageWithDebounce).mockResolvedValue('line1\nline2\nline3')
    vi.mocked(fetchPlatformTabCompletion).mockClear()
  })

  it('returns null when AI is not configured', async () => {
    const result = await inlineCompletionService.fetchCompletion({
      prefix: 'const x = ',
      suffix: '',
      language: 'javascript',
      filename: 'app.js',
      config: { provider: 'openai', apiKey: '' },
      loggedIn: false,
    })
    expect(result).toBeNull()
    expect(sendMessageWithDebounce).not.toHaveBeenCalled()
  })

  it('caches identical prefix/suffix requests', async () => {
    const config = { provider: 'openai' as const, apiKey: 'sk-test' }
    const req = {
      prefix: 'function hello() {\n  const x = ',
      suffix: '\n}',
      language: 'typescript',
      filename: 'a.ts',
      config,
      loggedIn: false,
    }

    const first = await inlineCompletionService.fetchCompletion(req)
    const second = await inlineCompletionService.fetchCompletion(req)

    expect(first).toBe('line1\nline2\nline3')
    expect(second).toBe('line1\nline2\nline3')
    expect(sendMessageWithDebounce).toHaveBeenCalledTimes(1)
    expect(getTabCompletionMetrics().cacheHits).toBe(1)
  })

  it('skips requests with too-short prefix on current line', async () => {
    const result = await inlineCompletionService.fetchCompletion({
      prefix: '  ',
      suffix: '',
      language: 'javascript',
      filename: 'app.js',
      config: { provider: 'openai', apiKey: 'sk-test' },
      loggedIn: false,
    })
    expect(result).toBeNull()
    expect(sendMessageWithDebounce).not.toHaveBeenCalled()
    expect(getTabCompletionMetrics().skipped).toBe(1)
  })

  it('uses distinct cache keys for empty suffix at EOF', () => {
    const config = { provider: 'openai' as const, apiKey: 'sk-test' }
    const base = {
      prefix: 'const value = 123',
      language: 'javascript',
      filename: 'app.js',
      config,
      loggedIn: false,
    }
    const eofKey = buildTabCompletionCacheKey({ ...base, suffix: '' }, 5)
    const midKey = buildTabCompletionCacheKey({ ...base, suffix: '\n}' }, 5)
    expect(eofKey).toContain('|eof')
    expect(midKey).not.toContain('|eof')
    expect(eofKey).not.toBe(midKey)
  })

  it('uses platform path when logged in with platform key mode', async () => {
    const result = await inlineCompletionService.fetchCompletion({
      prefix: 'const ',
      suffix: '',
      language: 'javascript',
      filename: 'app.js',
      config: { provider: 'openai', apiKey: '', keyMode: 'platform' },
      loggedIn: true,
    })
    expect(result).toBe('platform-line')
    expect(fetchPlatformTabCompletion).toHaveBeenCalledTimes(1)
    expect(sendMessageWithDebounce).not.toHaveBeenCalled()
    expect(getTabCompletionMetrics().platformSuccess).toBe(1)
  })
})
