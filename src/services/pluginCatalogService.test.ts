import { describe, expect, it } from 'vitest'
import { getCatalogEntry, PLUGIN_CATALOG } from './pluginCatalogService'

describe('pluginCatalogService', () => {
  it('lists curated catalog entries', () => {
    expect(PLUGIN_CATALOG.length).toBeGreaterThanOrEqual(7)
    expect(getCatalogEntry('json-formatter')?.rating).toBeGreaterThan(4)
    expect(getCatalogEntry('hello-sandbox')?.name).toBe('Hello 沙箱')
  })

  it('includes SDK v2 demo plugin', () => {
    const entry = getCatalogEntry('sdk-v2-status')
    expect(entry?.sdkVersion).toBe(2)
    expect(entry?.package.source).toContain('getMode')
    expect(entry?.permissions).toContain('debug:read')
  })
})
