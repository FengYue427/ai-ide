import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CAPSTONE_FUNNEL_METRIC_ORDER,
  readCapstoneFunnelMetrics,
  recordCapstoneFunnelMetric,
  resetCapstoneFunnelMetrics,
  summarizeCapstoneFunnelMetrics,
} from './capstoneFunnelMetrics'

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

describe('capstoneFunnelMetrics', () => {
  beforeEach(() => {
    store.clear()
  })

  it('records steps for a spec slug', () => {
    resetCapstoneFunnelMetrics('capstone')
    recordCapstoneFunnelMetric('welcome_click', 'capstone')
    recordCapstoneFunnelMetric('created', 'capstone')
    const metrics = readCapstoneFunnelMetrics()
    expect(metrics?.specSlug).toBe('capstone')
    expect(metrics?.steps.welcome_click).toBeTruthy()
    expect(metrics?.steps.created).toBeTruthy()
  })

  it('summarizes completion percent', () => {
    resetCapstoneFunnelMetrics('capstone')
    for (const step of CAPSTONE_FUNNEL_METRIC_ORDER.slice(0, 3)) {
      recordCapstoneFunnelMetric(step, 'capstone')
    }
    const summary = summarizeCapstoneFunnelMetrics(readCapstoneFunnelMetrics())
    expect(summary.completed).toBe(3)
    expect(summary.percent).toBe(50)
    expect(summary.lastStep).toBe('auto_launch')
  })
})
