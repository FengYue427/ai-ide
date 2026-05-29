import { describe, expect, it } from 'vitest'
import { canManageCollabMember, collabRoleCanWrite } from './collabPermissions'

describe('collabPermissions', () => {
  it('collabRoleCanWrite allows host and editor only', () => {
    expect(collabRoleCanWrite('host')).toBe(true)
    expect(collabRoleCanWrite('editor')).toBe(true)
    expect(collabRoleCanWrite('viewer')).toBe(false)
    expect(collabRoleCanWrite(null)).toBe(false)
  })

  it('canManageCollabMember requires host actor and non-host target', () => {
    expect(canManageCollabMember('host-user', 'host-user', 'editor')).toBe(true)
    expect(canManageCollabMember('host-user', 'host-user', 'viewer')).toBe(true)
    expect(canManageCollabMember('other', 'host-user', 'editor')).toBe(false)
    expect(canManageCollabMember('host-user', 'host-user', 'host')).toBe(false)
  })
})
