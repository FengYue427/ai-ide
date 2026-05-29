import { useEffect, useState } from 'react'
import { collaborationService } from '../services/collaborationService'
import type { CollabConnectionStatus } from '../services/collaborationTypes'

/** Reflect collaborationService connection status in React (F2). */
export function useCollabConnection(active: boolean) {
  const [status, setStatus] = useState<CollabConnectionStatus>(() =>
    active ? collaborationService.getConnectionStatus() : 'idle',
  )
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  useEffect(() => {
    if (!active) {
      setStatus('idle')
      setReconnectAttempt(0)
      return
    }

    const onStatus = (event: unknown) => {
      const payload = event as { status: CollabConnectionStatus; reconnectAttempt: number }
      setStatus(payload.status)
      setReconnectAttempt(payload.reconnectAttempt)
    }

    collaborationService.on('status', onStatus)
    setStatus(collaborationService.getConnectionStatus())
    setReconnectAttempt(collaborationService.getReconnectAttempt())

    return () => {
      collaborationService.off('status', onStatus)
    }
  }, [active])

  return { status, reconnectAttempt }
}
