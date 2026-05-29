import { afterEach, describe, expect, it } from 'vitest'
import {
  resolveBackgroundAgentAiConfig,
  resolveBackgroundAgentMaxRounds,
  resolveDeepSeekModelId,
} from './backgroundAgentConfig'

describe('backgroundAgentConfig', () => {
  const saved: Record<string, string | undefined> = {}

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  function saveEnv(key: string) {
    saved[key] = process.env[key]
  }

  it('requires BACKGROUND_AGENT_API_KEY', () => {
    saveEnv('BACKGROUND_AGENT_API_KEY')
    delete process.env.BACKGROUND_AGENT_API_KEY
    const result = resolveBackgroundAgentAiConfig('{}')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('BACKGROUND_AGENT_API_KEY_MISSING')
  })

  it('resolves provider and model from env', () => {
    saveEnv('BACKGROUND_AGENT_API_KEY')
    saveEnv('BACKGROUND_AGENT_PROVIDER')
    saveEnv('BACKGROUND_AGENT_MODEL')
    process.env.BACKGROUND_AGENT_API_KEY = 'sk-test'
    process.env.BACKGROUND_AGENT_PROVIDER = 'deepseek'
    process.env.BACKGROUND_AGENT_MODEL = 'deepseek-chat'
    const result = resolveBackgroundAgentAiConfig()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.config.provider).toBe('deepseek')
      expect(result.config.model).toBe(resolveDeepSeekModelId('deepseek-chat'))
    }
  })

  it('clamps max rounds', () => {
    saveEnv('BACKGROUND_AGENT_MAX_ROUNDS')
    process.env.BACKGROUND_AGENT_MAX_ROUNDS = '99'
    expect(resolveBackgroundAgentMaxRounds()).toBe(16)
    process.env.BACKGROUND_AGENT_MAX_ROUNDS = '3'
    expect(resolveBackgroundAgentMaxRounds()).toBe(3)
  })
})
