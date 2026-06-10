import { useEffect, useState } from 'react'
import { apiFetch } from '../services/apiUtils'

export type PluginOpsHealth = {
  publishEnabled: boolean
  officialKeyConfigured: boolean
}

export type PlatformAiHealthState =
  | { status: 'loading' }
  | { status: 'ready'; configured: boolean; provider?: string; plugins: PluginOpsHealth }
  | { status: 'unreachable'; plugins: PluginOpsHealth }

const DEFAULT_PLUGIN_OPS: PluginOpsHealth = {
  publishEnabled: false,
  officialKeyConfigured: false,
}

export async function fetchPlatformAiHealth(): Promise<
  Exclude<PlatformAiHealthState, { status: 'loading' }>
> {
  try {
    const res = await apiFetch('/api/health', { signal: AbortSignal.timeout(12_000) })
    const json = (await res.json()) as {
      platformAi?: { configured?: boolean; provider?: string }
      plugins?: { publishEnabled?: boolean; officialKeyConfigured?: boolean }
    }
    return {
      status: 'ready',
      configured: Boolean(json.platformAi?.configured),
      provider: json.platformAi?.provider,
      plugins: {
        publishEnabled: Boolean(json.plugins?.publishEnabled),
        officialKeyConfigured: Boolean(json.plugins?.officialKeyConfigured),
      },
    }
  } catch {
    return { status: 'unreachable', plugins: DEFAULT_PLUGIN_OPS }
  }
}

/** Probe GET /api/health → platformAi (v1.1.8.4). */
export function usePlatformAiHealth(enabled: boolean): PlatformAiHealthState {
  const [state, setState] = useState<PlatformAiHealthState>(
    enabled
      ? { status: 'loading' }
      : { status: 'ready', configured: false, plugins: DEFAULT_PLUGIN_OPS },
  )

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'ready', configured: false, plugins: DEFAULT_PLUGIN_OPS })
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
