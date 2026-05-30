import { describe, expect, it } from 'vitest'
import { countJaOverrides, auditPhase2JaCoverage } from '.'
import {
  getTranslationTable,
  JA_COVERAGE_TARGET_PCT,
  translateKey,
} from './localeTables'

describe('ja-JP locale skeleton (F3/F4)', () => {
  it('exposes ja-JP table with full key coverage via en-US fallback', () => {
    const table = getTranslationTable('ja-JP')
    const zhKeys = Object.keys(getTranslationTable('zh-CN'))
    for (const key of zhKeys) {
      expect(typeof table[key], key).toBe('string')
    }
  })

  it('has explicit Japanese overrides for Phase 2 priority strings', () => {
    expect(countJaOverrides()).toBeGreaterThanOrEqual(600)
    const t = (key: Parameters<typeof translateKey>[1], params?: Parameters<typeof translateKey>[2]) =>
      translateKey('ja-JP', key, params)
    expect(t('settings.lang.ja')).toBe('日本語')
    expect(t('collab.readOnlyBanner')).toMatch(/Viewer/)
    expect(t('welcome.title')).toMatch(/集中/)
    expect(t('chat.action.copy')).toMatch(/コピー/)
  })

  it('reports Phase 2 prefix audit rows', () => {
    const rows = auditPhase2JaCoverage()
    expect(rows.length).toBeGreaterThan(0)
    const collab = rows.find((row) => row.prefix === 'collab.')
    expect(collab?.totalKeys).toBeGreaterThan(40)
    expect(collab?.jaOverrides).toBeGreaterThan(40)
  })

  it(`meets F4 ≥${JA_COVERAGE_TARGET_PCT}% ja coverage for Phase 2 prefixes`, () => {
    const rows = auditPhase2JaCoverage()
    for (const row of rows) {
      expect(row.jaCoveragePct, row.prefix).toBeGreaterThanOrEqual(JA_COVERAGE_TARGET_PCT)
    }
  })
})
