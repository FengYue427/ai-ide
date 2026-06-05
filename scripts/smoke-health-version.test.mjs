import { describe, expect, it } from 'vitest'
import { isAcceptableSmokeHealthVersion, smokeHealthVersionHint } from './smoke-health-version.mjs'

describe('isAcceptableSmokeHealthVersion', () => {
  it('accepts missing or empty version', () => {
    expect(isAcceptableSmokeHealthVersion(undefined)).toBe(true)
    expect(isAcceptableSmokeHealthVersion('')).toBe(true)
  })

  it('accepts 1.2.x through 1.4.x', () => {
    expect(isAcceptableSmokeHealthVersion('1.2.9')).toBe(true)
    expect(isAcceptableSmokeHealthVersion('1.3.0')).toBe(true)
    expect(isAcceptableSmokeHealthVersion('1.4.0')).toBe(true)
    expect(isAcceptableSmokeHealthVersion('1.4.9')).toBe(true)
  })

  it('rejects other lines', () => {
    expect(isAcceptableSmokeHealthVersion('1.1.0')).toBe(false)
    expect(isAcceptableSmokeHealthVersion('1.5.0')).toBe(false)
    expect(isAcceptableSmokeHealthVersion('2.0.0')).toBe(false)
  })

  it('formats hint', () => {
    expect(smokeHealthVersionHint('9.9.9')).toContain('9.9.9')
  })
})
