import { describe, expect, it } from 'vitest'
import { getIndexBuildTelemetry, recordIndexBuildTelemetry, resetIndexBuildTelemetry } from './indexBuildTelemetry'

describe('indexBuildTelemetry', () => {
  it('records last build snapshot', () => {
    resetIndexBuildTelemetry()
    recordIndexBuildTelemetry({ durationMs: 120, mode: 'incremental', indexedFiles: 42, changeCount: 3 })
    const snap = getIndexBuildTelemetry()
    expect(snap.lastDurationMs).toBe(120)
    expect(snap.lastMode).toBe('incremental')
    expect(snap.lastIndexedFiles).toBe(42)
    expect(snap.lastChangeCount).toBe(3)
  })
})
