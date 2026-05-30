import { useCallback, useEffect, useState } from 'react'
import type { NpmScriptLastRun } from '../lib/npmScriptRun'
import { loadNpmScriptsLastRun, persistNpmScriptsLastRun } from '../services/npmScriptsLastRunService'

export function useNpmScriptsLastRun() {
  const [lastRun, setLastRun] = useState<NpmScriptLastRun | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadNpmScriptsLastRun().then((stored) => {
      if (!cancelled) setLastRun(stored)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const markRunning = useCallback(async (name: string) => {
    const next = await persistNpmScriptsLastRun(name, 'running')
    setLastRun(next)
    return next
  }, [])

  const markFinished = useCallback(async (name: string, status: 'success' | 'error', exitCode?: number) => {
    const next = await persistNpmScriptsLastRun(name, status, exitCode)
    setLastRun(next)
    return next
  }, [])

  return { lastRun, markRunning, markFinished }
}
