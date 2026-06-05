import { describe, expect, it } from 'vitest'
import { buildRuntimeStatePreview } from './runtimeStatePreview'

describe('runtimeStatePreview', () => {
  it('returns missing when runtime-state.json absent', () => {
    const preview = buildRuntimeStatePreview([{ name: 'index.js', content: '' }])
    expect(preview.exists).toBe(false)
    expect(preview.activeSpecPath).toBeNull()
  })

  it('builds summary for valid runtime-state.json', () => {
    const preview = buildRuntimeStatePreview([
      {
        name: '.aide/meta/runtime-state.json',
        content: JSON.stringify({
          version: 1,
          activeSpecPath: '.aide/specs/demo/tasks.md',
          queueSnapshot: { specPending: 1, planPending: 0 },
          updatedAt: '2026-06-05T10:00:05Z',
        }),
      },
    ])
    expect(preview.exists).toBe(true)
    expect(preview.parse.ok).toBe(true)
    expect(preview.activeSpecPath).toContain('demo')
    expect(preview.summaryLines.length).toBeGreaterThan(0)
  })
})
