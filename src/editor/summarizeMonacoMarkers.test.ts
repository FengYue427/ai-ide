import { describe, expect, it } from 'vitest'
import { summarizeMonacoMarkers } from './summarizeMonacoMarkers'

/** Monaco MarkerSeverity values (avoid importing monaco in vitest node). */
const SEVERITY_ERROR = 8
const SEVERITY_WARNING = 4

describe('summarizeMonacoMarkers', () => {
  it('counts errors and warnings', () => {
    const summary = summarizeMonacoMarkers([
      { severity: SEVERITY_ERROR } as never,
      { severity: SEVERITY_WARNING } as never,
      { severity: 1 } as never,
    ])
    expect(summary).toEqual({ errors: 1, warnings: 1, total: 2 })
  })
})
