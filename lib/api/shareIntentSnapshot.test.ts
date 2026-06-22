import { describe, expect, it } from 'vitest'
import { INTENT_SHARE_META_PATH, shareFilesIncludeIntentSnapshot } from './shareIntentSnapshot'

describe('shareFilesIncludeIntentSnapshot', () => {
  it('detects intent-share meta path', () => {
    expect(
      shareFilesIncludeIntentSnapshot([
        { name: 'index.html' },
        { name: INTENT_SHARE_META_PATH },
      ]),
    ).toBe(true)
  })

  it('normalizes Windows-style paths', () => {
    expect(
      shareFilesIncludeIntentSnapshot([{ name: '.aide\\meta\\intent-share.json' }]),
    ).toBe(true)
  })

  it('returns false when snapshot is absent', () => {
    expect(shareFilesIncludeIntentSnapshot([{ name: 'README.md' }])).toBe(false)
  })
})
