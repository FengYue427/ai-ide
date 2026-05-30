import { useEffect, useRef } from 'react'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'
import { isCollabM1Enabled } from '../lib/collabM1Features'
import { isCollabMemberRole, type CollabMemberRole } from '../lib/collabPermissions'
import { applyCollabRoomSnapshot, endCollabSession } from '../lib/collabRoomState'
import { authService } from '../services/authService'
import { fetchCollabRoom } from '../services/collabRoomsApiService'
import { collaborationService } from '../services/collaborationService'
import { useIDEStore } from '../store/ideStore'

/** Slow poll only for kick / membership when Yjs is unavailable (v1.1.3.7). */
const FALLBACK_POLL_MS = 120_000

type NotifyFn = (kind: ToastKind, title: string, detail?: string) => void

function roleLabel(role: CollabMemberRole, t: TranslateFn): string {
  if (role === 'host') return t('collab.role.host')
  if (role === 'viewer') return t('collab.role.viewer')
  return t('collab.role.editor')
}

function applyRoleIfChanged(
  nextRole: CollabMemberRole,
  prevRole: CollabMemberRole | null,
  notify: NotifyFn,
  t: TranslateFn,
): CollabMemberRole {
  const store = useIDEStore.getState()
  if (store.collaborationMemberRole === nextRole) {
    return nextRole
  }
  store.setCollaborationMemberRole(nextRole)
  collaborationService.applyMemberRole(nextRole)
  if (prevRole && prevRole !== nextRole) {
    notify('info', t('collab.m1.roleChangedTitle'), t('collab.m1.roleChanged', { role: roleLabel(nextRole, t) }))
  }
  return nextRole
}

/** Real-time role via Yjs map + fallback poll for kick (v1.1.3.7). */
export function useCollabRoleSync(notify: NotifyFn, t: TranslateFn): void {
  const roomId = useIDEStore((s) => s.collaborationRoomId)
  const collabM1 = isCollabM1Enabled()
  const lastRoleRef = useRef<CollabMemberRole | null>(useIDEStore.getState().collaborationMemberRole)
  const seenInRolesMapRef = useRef(false)

  useEffect(() => {
    lastRoleRef.current = useIDEStore.getState().collaborationMemberRole
    seenInRolesMapRef.current = false
  }, [roomId])

  useEffect(() => {
    if (!collabM1 || !roomId || !authService.getCurrentUser()) return

    let cancelled = false

    const handleRolesMap = (roles: Record<string, string>) => {
      if (cancelled) return
      const me = authService.getCurrentUser()
      if (!me?.id) return

      const roleRaw = roles[me.id]
      if (!roleRaw) {
        if (seenInRolesMapRef.current && Object.keys(roles).length > 0) {
          endCollabSession('kicked')
          notify('error', t('collab.m1.kickedTitle'), t('collab.m1.kicked'))
        }
        return
      }

      seenInRolesMapRef.current = true
      if (!isCollabMemberRole(roleRaw)) return

      const prevRole = lastRoleRef.current
      lastRoleRef.current = applyRoleIfChanged(roleRaw, prevRole, notify, t)
    }

    const unsubRoles = collaborationService.onMemberRolesChange(handleRolesMap)

    const syncFromServer = async () => {
      const code = useIDEStore.getState().collaborationRoomId
      if (!code || cancelled) return

      const result = await fetchCollabRoom(code, t)
      if (cancelled) return

      if (result.status === 403 || result.status === 404) {
        endCollabSession('kicked')
        notify('error', t('collab.m1.kickedTitle'), t('collab.m1.kicked'))
        return
      }

      if (!result.room) return

      const me = authService.getCurrentUser()
      const stillMember = result.room.members.some((member) => member.userId === me?.id)
      if (!stillMember && result.room.hostId !== me?.id) {
        endCollabSession('kicked')
        notify('error', t('collab.m1.kickedTitle'), t('collab.m1.kicked'))
        return
      }

      const prevRole = lastRoleRef.current
      const role = applyCollabRoomSnapshot(result.room, me?.id)
      lastRoleRef.current = role

      if (prevRole && prevRole !== role) {
        notify('info', t('collab.m1.roleChangedTitle'), t('collab.m1.roleChanged', { role: roleLabel(role, t) }))
      }
    }

    void syncFromServer()
    const interval = setInterval(() => void syncFromServer(), FALLBACK_POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncFromServer()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      unsubRoles()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [collabM1, roomId, notify, t])
}
