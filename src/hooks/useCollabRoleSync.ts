import { useEffect, useRef } from 'react'
import type { ToastKind } from '../components/FeedbackCenter'
import type { TranslateFn } from '../i18n'
import { isCollabM1Enabled } from '../lib/collabM1Features'
import { applyCollabRoomSnapshot, endCollabSession } from '../lib/collabRoomState'
import { authService } from '../services/authService'
import { fetchCollabRoom } from '../services/collabRoomsApiService'
import { useIDEStore } from '../store/ideStore'

const POLL_MS = 20_000

type NotifyFn = (kind: ToastKind, title: string, detail?: string) => void

/** Poll server room state for role changes and kick (v1.1.3.1). */
export function useCollabRoleSync(notify: NotifyFn, t: TranslateFn): void {
  const roomId = useIDEStore((s) => s.collaborationRoomId)
  const collabM1 = isCollabM1Enabled()
  const lastRoleRef = useRef(useIDEStore.getState().collaborationMemberRole)

  useEffect(() => {
    lastRoleRef.current = useIDEStore.getState().collaborationMemberRole
  }, [roomId])

  useEffect(() => {
    if (!collabM1 || !roomId || !authService.getCurrentUser()) return

    let cancelled = false

    const sync = async () => {
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
      const stillMember = result.room.members.some((m) => m.userId === me?.id)
      if (!stillMember && result.room.hostId !== me?.id) {
        endCollabSession('kicked')
        notify('error', t('collab.m1.kickedTitle'), t('collab.m1.kicked'))
        return
      }

      const prevRole = lastRoleRef.current
      const role = applyCollabRoomSnapshot(result.room, me?.id)
      lastRoleRef.current = role

      if (prevRole && prevRole !== role) {
        const roleLabel =
          role === 'host'
            ? t('collab.role.host')
            : role === 'viewer'
              ? t('collab.role.viewer')
              : t('collab.role.editor')
        notify('info', t('collab.m1.roleChangedTitle'), t('collab.m1.roleChanged', { role: roleLabel }))
      }
    }

    void sync()
    const interval = setInterval(() => void sync(), POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [collabM1, roomId, notify, t])
}
