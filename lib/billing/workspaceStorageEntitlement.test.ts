import { describe, expect, it } from 'vitest'
import {
  estimateWorkspacePayloadBytes,
  getStorageLimitBytes,
} from './workspaceStorageEntitlement'

describe('workspaceStorageEntitlement', () => {
  it('maps plan storage limits to bytes', () => {
    expect(getStorageLimitBytes('free')).toBe(5 * 1024 * 1024 * 1024)
    expect(getStorageLimitBytes('pro')).toBe(30 * 1024 * 1024 * 1024)
    expect(getStorageLimitBytes('enterprise')).toBe(100 * 1024 * 1024 * 1024)
  })

  it('estimates payload size from files + settings JSON', () => {
    const bytes = estimateWorkspacePayloadBytes('[{"name":"a.ts","content":"x"}]', '{}')
    expect(bytes).toBeGreaterThan(20)
  })
})
