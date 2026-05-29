export type CollabMemberRole = 'host' | 'editor' | 'viewer'

/** When role is unset (legacy demo), treat as writable. */
export function collabRoleCanWrite(role: CollabMemberRole | string | null | undefined): boolean {
  if (role == null || role === '') return true
  return role === 'host' || role === 'editor'
}

export function isCollabMemberRole(value: string): value is CollabMemberRole {
  return value === 'host' || value === 'editor' || value === 'viewer'
}
