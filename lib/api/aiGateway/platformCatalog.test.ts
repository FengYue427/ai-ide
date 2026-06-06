import { afterEach, describe, expect, it } from 'vitest'
import {
  listConfiguredPlatformProviders,
  parsePlatformProviderId,
  resolvePlatformCatalogRoute,
} from './platformCatalog'

describe('platformCatalog', () => {
  const env = process.env

  afterEach(() => {
    process.env = { ...env }
  })

  it('returns missing when no platform keys', () => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('PLATFORM_') || key === 'BACKGROUND_AGENT_API_KEY') {
        delete process.env[key]
      }
    }
    expect(resolvePlatformCatalogRoute().ok).toBe(false)
    expect(listConfiguredPlatformProviders()).toEqual([])
  })

  it('resolves deepseek when PLATFORM_DEEPSEEK_API_KEY is set', () => {
    process.env.PLATFORM_DEEPSEEK_API_KEY = 'sk-test'
    const result = resolvePlatformCatalogRoute()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.route.provider).toBe('deepseek')
      expect(result.route.adapter).toBe('openai-chat')
    }
    expect(listConfiguredPlatformProviders()).toContain('deepseek')
  })

  it('parses supported provider ids', () => {
    expect(parsePlatformProviderId('claude')).toBe('claude')
    expect(parsePlatformProviderId('unknown')).toBeNull()
  })
})
