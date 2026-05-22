import { serviceText } from '../lib/serviceI18n'

/** Expanded permission tokens (backward compatible with legacy broad scopes). */
export const ALL_PLUGIN_PERMISSIONS = [
  'editor',
  'editor:read',
  'editor:write',
  'files',
  'files:read',
  'files:write',
  'terminal:safe',
  'ai',
  'ui',
] as const

export type ExtendedPluginPermission = (typeof ALL_PLUGIN_PERMISSIONS)[number]

export function normalizePluginPermissions(
  permissions: readonly string[],
): ExtendedPluginPermission[] {
  const normalized: ExtendedPluginPermission[] = []
  for (const perm of permissions) {
    if (ALL_PLUGIN_PERMISSIONS.includes(perm as ExtendedPluginPermission)) {
      normalized.push(perm as ExtendedPluginPermission)
    }
  }
  return normalized
}

export function hasEditorRead(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('editor') || perms.has('editor:read')
}

export function hasEditorWrite(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('editor') || perms.has('editor:write')
}

export function hasFilesRead(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('files') || perms.has('files:read')
}

export function hasFilesWrite(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('files') || perms.has('files:write')
}

/** @deprecated Legacy `terminal` scope; third-party plugins must use terminal:safe only. */
export function hasTerminalFull(_perms: Set<ExtendedPluginPermission>): boolean {
  return false
}

export function hasTerminalSafe(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('terminal:safe')
}

export function hasTerminalAny(perms: Set<ExtendedPluginPermission>): boolean {
  return hasTerminalFull(perms) || hasTerminalSafe(perms)
}

export function hasAi(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('ai')
}

export function hasUi(perms: Set<ExtendedPluginPermission>): boolean {
  return perms.has('ui')
}

export function validateExtendedPermissions(permissions: readonly string[]): string | null {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return serviceText('plugin.perm.required')
  }
  if (permissions.includes('terminal')) {
    return serviceText('plugin.perm.terminalDeprecated')
  }
  for (const perm of permissions) {
    if (!ALL_PLUGIN_PERMISSIONS.includes(perm as ExtendedPluginPermission)) {
      return serviceText('plugin.perm.unknown', { perm })
    }
  }
  return null
}
