import { useCallback, useEffect, useState } from 'react'
import {
  fetchPlatformUsageDashboard,
  type PlatformUsageDashboard,
} from '../services/platformUsageDashboardService'

export type PlatformUsageDashboardState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: PlatformUsageDashboard }
  | { status: 'error' }

export function usePlatformUsageDashboard(enabled: boolean): {
  state: PlatformUsageDashboardState
  refresh: () => void
  refreshing: boolean
} {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<PlatformUsageDashboardState>(
    enabled ? { status: 'loading' } : { status: 'idle' },
  )

  const refresh = useCallback(() => {
    if (!enabled) return
    setTick((n) => n + 1)
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' })
      return
    }

    const controller = new AbortController()
    setState({ status: 'loading' })

    void (async () => {
      const data = await fetchPlatformUsageDashboard(controller.signal)
      if (controller.signal.aborted) return
      if (data) {
        setState({ status: 'ready', data })
      } else {
        setState({ status: 'error' })
      }
    })()

    return () => controller.abort()
  }, [enabled, tick])

  return {
    state,
    refresh,
    refreshing: enabled && state.status === 'loading' && tick > 0,
  }
}
