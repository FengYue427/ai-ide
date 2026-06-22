import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  clearCapstoneFunnel,
  readCapstoneFunnel,
  resolveCapstoneFunnelStep,
  startCapstoneFunnel,
} from './capstoneFunnel'
import type { SpecAcceptanceLinkage } from './specAcceptanceLinkage'

const store = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value)
  },
  removeItem: (key: string) => {
    store.delete(key)
  },
})

const linkage = (overrides: Partial<SpecAcceptanceLinkage>): SpecAcceptanceLinkage => ({
  activeSpecSlug: 'capstone',
  tasksPath: '.aide/specs/capstone/tasks.md',
  acceptancePath: '.aide/specs/capstone/acceptance.md',
  openTaskCount: 0,
  openAcceptanceCount: 0,
  readyForProof: false,
  ...overrides,
})

describe('capstoneFunnel', () => {
  beforeEach(() => {
    store.clear()
    clearCapstoneFunnel()
  })

  it('persists funnel state', () => {
    startCapstoneFunnel('capstone')
    expect(readCapstoneFunnel()?.specSlug).toBe('capstone')
  })

  it('resolves run-tasks when open tasks remain', () => {
    startCapstoneFunnel('capstone')
    const funnel = readCapstoneFunnel()
    expect(
      resolveCapstoneFunnelStep(funnel, linkage({ openTaskCount: 2 }), 'capstone'),
    ).toBe('run-tasks')
  })

  it('clears funnel when proof is ready', () => {
    startCapstoneFunnel('capstone')
    const funnel = readCapstoneFunnel()
    expect(
      resolveCapstoneFunnelStep(funnel, linkage({ readyForProof: true }), 'capstone'),
    ).toBeNull()
    expect(readCapstoneFunnel()).toBeNull()
  })
})
