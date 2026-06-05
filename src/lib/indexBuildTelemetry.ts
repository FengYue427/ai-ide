/** v1.3 F2 — last project index build timing (in-memory, dev/settings). */

export type IndexBuildMode = 'full' | 'incremental' | 'worker'

export interface IndexBuildTelemetrySnapshot {
  lastDurationMs: number | null
  lastMode: IndexBuildMode | null
  lastIndexedFiles: number
  lastChangeCount: number
  lastAt: number | null
}

const state: IndexBuildTelemetrySnapshot = {
  lastDurationMs: null,
  lastMode: null,
  lastIndexedFiles: 0,
  lastChangeCount: 0,
  lastAt: null,
}

export function recordIndexBuildTelemetry(input: {
  durationMs: number
  mode: IndexBuildMode
  indexedFiles: number
  changeCount?: number
}): void {
  state.lastDurationMs = Math.max(0, Math.round(input.durationMs))
  state.lastMode = input.mode
  state.lastIndexedFiles = input.indexedFiles
  state.lastChangeCount = input.changeCount ?? 0
  state.lastAt = Date.now()
}

export function getIndexBuildTelemetry(): IndexBuildTelemetrySnapshot {
  return { ...state }
}

export function resetIndexBuildTelemetry(): void {
  state.lastDurationMs = null
  state.lastMode = null
  state.lastIndexedFiles = 0
  state.lastChangeCount = 0
  state.lastAt = null
}
