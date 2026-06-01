import { describe, expect, it, vi } from 'vitest'
import { isAiConfigured, shouldUsePlatformAi } from './aiPlatformMode'
import type { AIConfig } from '../services/aiService'

describe('aiPlatformMode', () => {
  const base: AIConfig = {
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-v4-flash',
    keyMode: 'platform',
  }

  it('treats logged-in platform mode as configured without apiKey', () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    expect(isAiConfigured(base, true)).toBe(true)
    expect(shouldUsePlatformAi(base, true)).toBe(true)
    vi.unstubAllEnvs()
  })

  it('requires apiKey in byok mode', () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    expect(isAiConfigured({ ...base, keyMode: 'byok' }, true)).toBe(false)
    expect(isAiConfigured({ ...base, keyMode: 'byok', apiKey: 'sk-x' }, true)).toBe(true)
    vi.unstubAllEnvs()
  })
})
