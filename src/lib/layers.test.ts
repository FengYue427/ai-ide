import { describe, expect, it } from 'vitest'
import { isZAbove, Z, Z_STACK_ORDER } from './layers'

describe('layers', () => {
  it('Z_STACK_ORDER is strictly increasing', () => {
    for (let i = 1; i < Z_STACK_ORDER.length; i++) {
      expect(Z_STACK_ORDER[i]).toBeGreaterThan(Z_STACK_ORDER[i - 1]!)
    }
  })

  it('command above modal, confirm above toast', () => {
    expect(isZAbove(Z.command, Z.modal)).toBe(true)
    expect(isZAbove(Z.confirm, Z.toast)).toBe(true)
    expect(isZAbove(Z.fatal, Z.confirm)).toBe(true)
  })

  it('modal elevated above modal', () => {
    expect(isZAbove(Z.modalElevated, Z.modal)).toBe(true)
  })
})
