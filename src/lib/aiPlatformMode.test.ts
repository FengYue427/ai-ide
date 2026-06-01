import { describe, expect, it, vi } from 'vitest'
import { getAiRuntimeMode, isAiConfigured, shouldUsePlatformAi } from './aiPlatformMode'
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

  it('reports runtime mode for plugins', () => {
    vi.stubEnv('VITE_AI_GATEWAY', 'true')
    expect(getAiRuntimeMode(base, true)).toBe('platform')
    expect(getAiRuntimeMode({ ...base, keyMode: 'byok', apiKey: 'sk' }, true)).toBe('byok')
    expect(getAiRuntimeMode(base, false)).toBe('unconfigured')
    expect(getAiRuntimeMode({ ...base, provider: 'ollama' }, false)).toBe('ollama')
    vi.unstubAllEnvs()
  })
})
