import { describe, expect, it } from 'vitest'
import { getCatalogEntry, PLUGIN_CATALOG } from './pluginCatalogService'

describe('pluginCatalogService', () => {
  it('lists curated catalog entries', () => {
    expect(PLUGIN_CATALOG.length).toBeGreaterThanOrEqual(2)
    expect(getCatalogEntry('hello-sandbox')?.name).toBe('Hello 沙箱')
  })
})
