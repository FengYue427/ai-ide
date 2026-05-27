import { describe, expect, it } from 'vitest'
import { toElectronSemver } from './electron-semver.mjs'

describe('toElectronSemver', () => {
  it('passes through three-part semver', () => {
    expect(toElectronSemver('1.0.4')).toBe('1.0.4')
    expect(toElectronSemver('1.0.3-rc.1')).toBe('1.0.3-rc.1')
  })

  it('maps fourth segment for electron-builder', () => {
    expect(toElectronSemver('1.0.6.4')).toBe('1.0.604')
    expect(toElectronSemver('1.0.2.7')).toBe('1.0.207')
    expect(toElectronSemver('1.0.4.4')).toBe('1.0.404')
  })

  it('rejects invalid input', () => {
    expect(() => toElectronSemver('1.0.6.4.5')).toThrow(/Invalid version/)
    expect(() => toElectronSemver('')).toThrow(/Invalid version/)
  })
})
