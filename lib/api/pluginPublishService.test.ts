import { describe, expect, it } from 'vitest'
import { createPluginPublishReview, validatePluginPublishBody } from './pluginPublishService'

const validPkg = {
  package: {
    manifest: {
      id: 'demo-plugin',
      name: 'Demo',
      version: '1.0.0',
      entry: 'main.js',
      permissions: ['ui'],
    },
    source: 'function activate(context) {}',
  },
}

describe('pluginPublishService', () => {
  it('accepts a minimal valid package', () => {
    const result = validatePluginPublishBody(validPkg)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.pkg.manifest.id).toBe('demo-plugin')
  })

  it('rejects missing source', () => {
    const result = validatePluginPublishBody({
      package: { manifest: validPkg.package.manifest },
    })
    expect(result).toEqual({ ok: false, errorKey: 'api.plugin.publishSourceRequired' })
  })

  it('rejects invalid plugin id', () => {
    const result = validatePluginPublishBody({
      package: {
        ...validPkg.package,
        manifest: { ...validPkg.package.manifest, id: 'Bad_ID' },
      },
    })
    expect(result).toEqual({ ok: false, errorKey: 'api.plugin.publishInvalidId' })
  })

  it('creates a pending review record', async () => {
    const validated = validatePluginPublishBody(validPkg)
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    const review = await createPluginPublishReview(validated.pkg, 'user-1')
    expect(review.status).toBe('pending')
    expect(review.reviewId).toMatch(/^rev_[a-f0-9]{16}$/)
    expect(review.pluginId).toBe('demo-plugin')
  })
})
