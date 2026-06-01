import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assessPluginCatalogInstall } from './pluginTrustService'
import { getCatalogEntry } from './pluginCatalogService'

describe('pluginTrustService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', '')
  })

  it('allows catalog install when trust market is off', async () => {
    const entry = getCatalogEntry('sdk-v2-status')
    expect(entry).toBeDefined()
    await expect(assessPluginCatalogInstall(entry!)).resolves.toEqual({ allowed: true })
  })

  it('requires valid signature for verified tier when trust market is on', async () => {
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', 'true')
    const entry = getCatalogEntry('sdk-v2-status')
    await expect(assessPluginCatalogInstall(entry!)).resolves.toEqual({ allowed: true })
  })

  it('rejects unsigned tier when trust market is on', async () => {
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', 'true')
    const entry = getCatalogEntry('hello-sandbox')!
    const tampered = {
      ...entry,
      trustTier: 'unsigned' as const,
    }
    const result = await assessPluginCatalogInstall(tampered)
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.error.length).toBeGreaterThan(0)
  })

  it('requires community confirmation', async () => {
    vi.stubEnv('VITE_PLUGIN_TRUST_MARKET', 'true')
    const entry = getCatalogEntry('hello-sandbox')!
    const community = { ...entry, trustTier: 'community' as const }
    const blocked = await assessPluginCatalogInstall(community)
    expect(blocked).toMatchObject({ allowed: false, requiresCommunityConfirm: true })
    const ok = await assessPluginCatalogInstall(community, { userConfirmedCommunity: true })
    expect(ok).toEqual({ allowed: true })
  })
})
