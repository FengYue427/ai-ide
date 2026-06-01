import { describe, expect, it } from 'vitest'
import {
  hasEditorRead,
  hasEditorWrite,
  hasFilesRead,
  hasFilesWrite,
  hasDebugRead,
  hasTerminalSafe,
  normalizePluginPermissions,
  validateExtendedPermissions,
} from './pluginPermissions'

describe('pluginPermissions', () => {
  it('accepts legacy broad permissions', () => {
    expect(validateExtendedPermissions(['editor', 'files', 'ui'])).toBeNull()
  })

  it('accepts granular permissions', () => {
    expect(validateExtendedPermissions(['editor:read', 'files:write', 'terminal:safe'])).toBeNull()
  })

  it('maps editor to read and write', () => {
    const perms = new Set(normalizePluginPermissions(['editor']))
    expect(hasEditorRead(perms)).toBe(true)
    expect(hasEditorWrite(perms)).toBe(true)
  })

  it('splits read/write scopes', () => {
    const readOnly = new Set(normalizePluginPermissions(['editor:read', 'files:read']))
    expect(hasEditorRead(readOnly)).toBe(true)
    expect(hasEditorWrite(readOnly)).toBe(false)
    expect(hasFilesRead(readOnly)).toBe(true)
    expect(hasFilesWrite(readOnly)).toBe(false)
  })

  it('supports terminal safe mode', () => {
    const perms = new Set(normalizePluginPermissions(['terminal:safe']))
    expect(hasTerminalSafe(perms)).toBe(true)
  })

  it('rejects legacy terminal full scope', () => {
    expect(validateExtendedPermissions(['terminal', 'ui'])).toMatch(/terminal:safe/)
  })

  it('accepts debug read scope', () => {
    expect(validateExtendedPermissions(['debug:read', 'ai'])).toBeNull()
    const perms = new Set(normalizePluginPermissions(['debug:read']))
    expect(hasDebugRead(perms)).toBe(true)
  })
})
