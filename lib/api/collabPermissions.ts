import type { CollabMemberRole } from './collabTypes'

export function collabRoleCanWrite(role: CollabMemberRole | null | undefined): boolean {
  return role === 'host' || role === 'editor'
}

export function canManageCollabMember(
  actorUserId: string,
  roomHostId: string,
  targetRole: CollabMemberRole,
): boolean {
  return actorUserId === roomHostId && targetRole !== 'host'
}
