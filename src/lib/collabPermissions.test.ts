import { describe, expect, it } from 'vitest'
import { collabRoleCanWrite } from './collabPermissions'

describe('collabPermissions (client)', () => {
  it('treats unset role as writable for legacy demo', () => {
    expect(collabRoleCanWrite(null)).toBe(true)
    expect(collabRoleCanWrite(undefined)).toBe(true)
  })

  it('blocks viewer writes', () => {
    expect(collabRoleCanWrite('viewer')).toBe(false)
    expect(collabRoleCanWrite('editor')).toBe(true)
  })
})
