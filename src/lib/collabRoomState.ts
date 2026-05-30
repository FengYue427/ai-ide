import type { CollabRoomClient } from '../services/collabRoomsApiService'
import { collaborationService } from '../services/collaborationService'
import { useIDEStore } from '../store/ideStore'
import { isCollabMemberRole, type CollabMemberRole } from './collabPermissions'

export function resolveCollabMemberRole(
  room: CollabRoomClient,
  userId: string | undefined,
): CollabMemberRole {
  if (!userId) return 'editor'
  const myMember = room.members.find((m) => m.userId === userId)
  const roleRaw = myMember?.role ?? (room.hostId === userId ? 'host' : 'editor')
  return isCollabMemberRole(roleRaw) ? roleRaw : 'editor'
}

export function applyCollabRoomSnapshot(
  room: CollabRoomClient,
  userId: string | undefined,
): CollabMemberRole {
  const role = resolveCollabMemberRole(room, userId)
  const store = useIDEStore.getState()
  store.setCollaborationMemberRole(role)
  store.setCollaborationRoomMembers(room.members)
  collaborationService.applyMemberRole(role)
  return role
}

export function clearCollabSessionState(): void {
  const store = useIDEStore.getState()
  store.setCollaborationRoomId(null)
  store.setCollaborationMemberRole(null)
  store.setCollaborationRoomMembers(null)
}

export type CollabSessionEndReason = 'kicked' | 'left'

export function endCollabSession(reason: CollabSessionEndReason): void {
  collaborationService.leaveRoom()
  clearCollabSessionState()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('collab-session-ended', { detail: { reason } }))
  }
}
