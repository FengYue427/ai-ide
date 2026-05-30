import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dismissWelcomeOnboarding,
  LARGE_WORKSPACE_FILE_HINT,
  shouldShowWelcomeOnboarding,
  shouldShowWorkspacePerformanceHint,
} from './welcomeOnboarding'

function mockLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    clear: () => store.clear(),
  })
}

describe('welcomeOnboarding', () => {
  beforeEach(() => {
    mockLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows onboarding until dismissed', () => {
    expect(shouldShowWelcomeOnboarding()).toBe(true)
    dismissWelcomeOnboarding()
    expect(shouldShowWelcomeOnboarding()).toBe(false)
  })

  it('flags large workspaces for performance hint', () => {
    expect(shouldShowWorkspacePerformanceHint(LARGE_WORKSPACE_FILE_HINT - 1)).toBe(false)
    expect(shouldShowWorkspacePerformanceHint(LARGE_WORKSPACE_FILE_HINT)).toBe(true)
  })
})
