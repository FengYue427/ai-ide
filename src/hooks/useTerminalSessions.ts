import { useCallback, useEffect, useRef, useState } from 'react'
import {
  closeTerminalSession,
  createTerminalSession,
  getTerminalSessionsMetaPrefs,
  switchTerminalSession,
  type TerminalSessionMeta,
} from '../lib/terminalSessionsManager'
import { bootstrapTerminalSessionsFromStorage, persistTerminalSessionsMeta } from '../services/terminalSessionsPrefsService'

export function useTerminalSessions() {
  const [sessions, setSessions] = useState<TerminalSessionMeta[]>([{ id: 'main', label: '1' }])
  const [activeId, setActiveId] = useState('main')
  const hydratedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(() => {
    const meta = getTerminalSessionsMetaPrefs()
    setSessions(meta.sessions)
    setActiveId(meta.activeId)
  }, [])

  useEffect(() => {
    let cancelled = false
    void bootstrapTerminalSessionsFromStorage().then((meta) => {
      if (cancelled) return
      setSessions(meta.sessions)
      setActiveId(meta.activeId)
      hydratedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persistTerminalSessionsMeta(getTerminalSessionsMetaPrefs())
    }, 400)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [sessions, activeId])

  const switchSession = useCallback(
    (id: string) => {
      const replay = switchTerminalSession(id)
      refresh()
      return replay
    },
    [refresh],
  )

  const addSession = useCallback(() => {
    const created = createTerminalSession()
    if (!created) return null
    const replay = switchTerminalSession(created.id)
    refresh()
    return { created, replay }
  }, [refresh])

  const removeSession = useCallback(
    (id: string) => {
      if (!closeTerminalSession(id)) return null
      const replay = switchTerminalSession(getTerminalSessionsMetaPrefs().activeId)
      refresh()
      return replay
    },
    [refresh],
  )

  return {
    sessions,
    activeId,
    canAddSession: sessions.length < 4,
    switchSession,
    addSession,
    removeSession,
    refresh,
  }
}
