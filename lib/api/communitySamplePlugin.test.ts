import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validatePluginPublishBody } from './pluginPublishService'

const samplePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'fixtures/plugins/community-sample/community-sample.plugin.json',
)

describe('community-sample fixture', () => {
  it('passes publish validation', () => {
    const pkg = JSON.parse(readFileSync(samplePath, 'utf8'))
    const result = validatePluginPublishBody({ package: pkg })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.pkg.manifest.id).toBe('community-sample')
      expect(result.pkg.manifest.permissions).toEqual(['ui'])
    }
  })
})
