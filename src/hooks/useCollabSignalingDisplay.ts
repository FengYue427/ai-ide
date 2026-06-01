import { useEffect, useState } from 'react'
import { collaborationService } from '../services/collaborationService'
import { useCollabConnection } from './useCollabConnection'

export type CollabSignalingMode = 'livekit' | 'yjs-webrtc'

/** Signaling mode for status bar / chrome (stable once a collab session exists). */
export function useCollabSignalingDisplay(roomId: string | null) {
  const active = Boolean(roomId)
  const { status: connStatus } = useCollabConnection(active)
  const [signalingMode, setSignalingMode] = useState<CollabSignalingMode | null>(() =>
    active ? collaborationService.getSignalingMode() : null,
  )

  useEffect(() => {
    if (!active) {
      setSignalingMode(null)
      return
    }
    setSignalingMode(collaborationService.getSignalingMode())
  }, [active, connStatus, roomId])

  return { signalingMode, connStatus }
}
