import { describe, expect, it, vi } from 'vitest'
import { describeTabCompletionStrategy, resolveTabCompletionStrategy } from './tabCompletionStrategy'
import type { AIConfig } from '../services/aiService'

vi.mock('./aiPlatformMode', () => ({
  shouldUsePlatformAi: vi.fn((config: AIConfig, loggedIn: boolean) =>
    loggedIn && config.keyMode === 'platform',
  ),
}))

vi.mock('../services/fimCompletionService', () => ({
  supportsFimApi: (provider: string) => provider === 'deepseek',
}))

describe('tabCompletionStrategy', () => {
  it('prefers fim for ollama and deepseek with key', () => {
    expect(resolveTabCompletionStrategy({ provider: 'ollama', apiKey: '' }, false)).toBe('fim')
    expect(
      resolveTabCompletionStrategy({ provider: 'deepseek', apiKey: 'sk' }, false),
    ).toBe('fim')
  })

  it('uses platform when logged in with platform key mode', () => {
    expect(
      resolveTabCompletionStrategy(
        { provider: 'openai', apiKey: '', keyMode: 'platform' },
        true,
      ),
    ).toBe('platform')
  })

  it('falls back to chat for BYOK non-FIM', () => {
    expect(
      resolveTabCompletionStrategy({ provider: 'openai', apiKey: 'sk' }, false),
    ).toBe('chat')
  })

  it('returns none without key or platform', () => {
    expect(resolveTabCompletionStrategy({ provider: 'openai', apiKey: '' }, false)).toBe('none')
    expect(describeTabCompletionStrategy({ provider: 'openai', apiKey: '' }, false)).toBe('off')
  })
})
