import { useEffect, useState } from 'react'
import { apiFetch } from '../services/apiUtils'

const SLOW_MS = 6_000

export type CloudHealthState =
  | { status: 'loading' }
  | { status: 'ok'; slow?: boolean }
  | { status: 'degraded'; database?: string; slow?: boolean }

/** One-shot production health probe for RC messaging (account / cloud sync). */
export function useCloudHealth(): CloudHealthState {
  const [state, setState] = useState<CloudHealthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const started = performance.now()

    void (async () => {
      try {
        const res = await apiFetch('/api/health', { signal: AbortSignal.timeout(12_000) })
        const elapsed = performance.now() - started
        const slow = elapsed >= SLOW_MS
        const json = (await res.json()) as { status?: string; database?: string }
        if (cancelled) return
        if (res.ok && json.status === 'ok' && json.database === 'connected') {
          setState(slow ? { status: 'ok', slow: true } : { status: 'ok' })
          return
        }
        setState({ status: 'degraded', database: json.database, slow })
      } catch {
        const slow = performance.now() - started >= SLOW_MS
        if (!cancelled) setState({ status: 'degraded', database: 'unreachable', slow })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/** Show CN / vercel.app network guidance on welcome. */
export function shouldShowNetworkTips(
  cloud: CloudHealthState,
  desktop: boolean,
): boolean {
  if (desktop) return false
  if (cloud.status === 'loading') return false
  if (cloud.status === 'degraded') return true
  return cloud.slow === true
}
