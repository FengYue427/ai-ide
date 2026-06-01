import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getPluginOfficialPublicKey,
  isPluginOfficialPublicKeyConfigured,
  isPluginPublishEnabled,
} from './pluginPublishConfig'

describe('pluginPublishConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('publish disabled by default', () => {
    vi.stubEnv('PLUGIN_PUBLISH_ENABLED', '')
    expect(isPluginPublishEnabled()).toBe(false)
  })

  it('reads official public key from env', () => {
    vi.stubEnv('PLUGIN_OFFICIAL_PUBLIC_KEY', 'abc123')
    expect(getPluginOfficialPublicKey()).toBe('abc123')
    expect(isPluginOfficialPublicKeyConfigured()).toBe(true)
  })
})
