import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n'
import { resolveAideLinkFeatureLabel } from './aideLinkFeatureLabels'

describe('aideLinkFeatureLabels', () => {
  it('maps known feature ids to readable labels', () => {
    const t = createTranslator('zh-CN')
    expect(resolveAideLinkFeatureLabel('autopilot', t)).toBe('Autopilot 不限')
    expect(resolveAideLinkFeatureLabel('aiQuota', t)).toBe('AI 配额')
  })

  it('falls back to raw id for unknown features', () => {
    const t = createTranslator('en-US')
    expect(resolveAideLinkFeatureLabel('unknownFeature', t)).toBe('unknownFeature')
  })
})
