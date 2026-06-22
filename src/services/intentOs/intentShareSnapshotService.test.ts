import { describe, expect, it } from 'vitest'
import {
  appendIntentSnapshotToShareFiles,
  buildIntentShareSnapshot,
  formatIntentShareSummary,
  INTENT_SHARE_META_PATH,
} from './intentShareSnapshotService'

describe('intentShareSnapshotService', () => {
  const files = [
    {
      name: '.aide/specs/demo/tasks.md',
      content: '- [x] Done\n- [ ] Open\n',
      language: 'markdown',
    },
    {
      name: '.aide/specs/demo/acceptance.md',
      content: '- [ ] Check\n',
      language: 'markdown',
    },
    {
      name: '.aide/meta/runtime-state.json',
      content: JSON.stringify({ version: 1, activeSpecPath: '.aide/specs/demo/tasks.md' }),
      language: 'json',
    },
  ]

  it('builds snapshot with spec progress and graph', () => {
    const snapshot = buildIntentShareSnapshot(files)
    expect(snapshot.version).toBe(1)
    expect(snapshot.specs[0]?.doneTasks).toBe(1)
    expect(snapshot.graph.nodes.length).toBeGreaterThan(0)
  })

  it('appends intent-share.json for share payload', () => {
    const next = appendIntentSnapshotToShareFiles(files)
    const meta = next.find((f) => f.name === INTENT_SHARE_META_PATH)
    expect(meta?.content).toContain('"graph"')
  })

  it('formats summary line', () => {
    const snapshot = buildIntentShareSnapshot(files)
    expect(formatIntentShareSummary(snapshot)).toContain('demo: 1/2 tasks')
  })
})
