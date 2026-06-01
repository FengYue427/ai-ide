import { afterEach, describe, expect, it } from 'vitest'
import { isPlatformAiConfigured, resolvePlatformAiRoute } from './platformConfig'

describe('resolvePlatformAiRoute', () => {
  const env = process.env

  afterEach(() => {
    process.env = { ...env }
  })

  it('returns missing when no platform keys', () => {
    delete process.env.PLATFORM_DEEPSEEK_API_KEY
    delete process.env.BACKGROUND_AGENT_API_KEY
    expect(resolvePlatformAiRoute().ok).toBe(false)
  })

  it('resolves deepseek when PLATFORM_DEEPSEEK_API_KEY is set', () => {
    process.env.PLATFORM_DEEPSEEK_API_KEY = 'sk-test'
    const result = resolvePlatformAiRoute()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.route.provider).toBe('deepseek')
      expect(result.route.endpoint).toContain('deepseek.com')
    }
    expect(isPlatformAiConfigured()).toBe(true)
  })
})
