import { useEffect, useState } from 'react'
import { isOAuthEnabled } from '../lib/authFeatures'
import { readJsonResponse, apiFetch } from '../services/apiUtils'

export type OAuthProvidersState = {
  loading: boolean
  showSection: boolean
  showGithub: boolean
  showGoogle: boolean
}

export function resolveOAuthProvidersState(
  clientFlag: boolean,
  providers: { github: boolean; google: boolean } | null,
): OAuthProvidersState {
  if (providers === null) {
    return {
      loading: true,
      showSection: clientFlag,
      showGithub: clientFlag,
      showGoogle: clientFlag,
    }
  }

  return {
    loading: false,
    showSection: providers.github || providers.google,
    showGithub: providers.github,
    showGoogle: providers.google,
  }
}

/** Client build flag or live /api/auth/oauth/providers (desktop + web parity). */
export function useOAuthProviders(): OAuthProvidersState {
  const clientFlag = isOAuthEnabled()
  const [providers, setProviders] = useState<{ github: boolean; google: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/auth/oauth/providers')
      .then((r) => readJsonResponse<{ github?: boolean; google?: boolean }>(r))
      .then((data) => {
        if (cancelled) return
        setProviders({
          github: Boolean(data?.github),
          google: Boolean(data?.google),
        })
      })
      .catch(() => {
        if (!cancelled) setProviders({ github: false, google: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return resolveOAuthProvidersState(clientFlag, providers)
}
