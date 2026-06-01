import { useEffect, useState } from 'react'

export type PlatformAiHealthState =
  | { status: 'loading' }
  | { status: 'ready'; configured: boolean; provider?: string }
  | { status: 'unreachable' }

export async function fetchPlatformAiHealth(): Promise<
  Exclude<PlatformAiHealthState, { status: 'loading' }>
> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(12_000) })
    const json = (await res.json()) as {
      platformAi?: { configured?: boolean; provider?: string }
    }
    return {
      status: 'ready',
      configured: Boolean(json.platformAi?.configured),
      provider: json.platformAi?.provider,
    }
  } catch {
    return { status: 'unreachable' }
  }
}

/** Probe GET /api/health → platformAi (v1.1.8.4). */
export function usePlatformAiHealth(enabled: boolean): PlatformAiHealthState {
  const [state, setState] = useState<PlatformAiHealthState>(
    enabled ? { status: 'loading' } : { status: 'ready', configured: false },
  )

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'ready', configured: false })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    void (async () => {
      const next = await fetchPlatformAiHealth()
      if (!cancelled) setState(next)
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}
