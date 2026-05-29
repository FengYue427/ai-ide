import { afterEach, describe, expect, it } from 'vitest'
import { isBackgroundAgentEnabled } from './backgroundAgentFeatures'

describe('backgroundAgentFeatures', () => {
  afterEach(() => {
    delete import.meta.env.VITE_BACKGROUND_AGENT
  })

  it('is off unless VITE_BACKGROUND_AGENT=true', () => {
    expect(isBackgroundAgentEnabled()).toBe(false)
    import.meta.env.VITE_BACKGROUND_AGENT = 'true'
    expect(isBackgroundAgentEnabled()).toBe(true)
  })
})
