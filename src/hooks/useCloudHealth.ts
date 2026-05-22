import { useEffect, useState } from 'react'

export type CloudHealthState =
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'degraded'; database?: string }

/** One-shot production health probe for RC messaging (account / cloud sync). */
export function useCloudHealth(): CloudHealthState {
  const [state, setState] = useState<CloudHealthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(12_000) })
        const json = (await res.json()) as { status?: string; database?: string }
        if (cancelled) return
        if (res.ok && json.status === 'ok' && json.database === 'connected') {
          setState({ status: 'ok' })
          return
        }
        setState({ status: 'degraded', database: json.database })
      } catch {
        if (!cancelled) setState({ status: 'degraded', database: 'unreachable' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
