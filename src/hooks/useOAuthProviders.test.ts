import { describe, expect, it } from 'vitest'
import { resolveOAuthProvidersState } from './useOAuthProviders'

describe('resolveOAuthProvidersState', () => {
  it('shows server-configured providers without client build flag', () => {
    const state = resolveOAuthProvidersState(false, { github: true, google: false })
    expect(state).toEqual({
      loading: false,
      showSection: true,
      showGithub: true,
      showGoogle: false,
    })
  })

  it('hides oauth when server has no providers', () => {
    const state = resolveOAuthProvidersState(false, { github: false, google: false })
    expect(state.showSection).toBe(false)
  })

  it('optimistically shows oauth while loading when client flag is on', () => {
    const state = resolveOAuthProvidersState(true, null)
    expect(state.loading).toBe(true)
    expect(state.showSection).toBe(true)
    expect(state.showGithub).toBe(true)
    expect(state.showGoogle).toBe(true)
  })
})
