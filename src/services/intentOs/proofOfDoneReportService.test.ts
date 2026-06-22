import { describe, expect, it } from 'vitest'
import {
  buildProofOfDoneHtml,
  buildProofOfDoneMarkdown,
  buildProofReportPaths,
  collectDeliverableSnapshots,
  resolveProofTasksPath,
} from './proofOfDoneReportService'

const FILES = [
  {
    name: '.aide/specs/intent-demo/tasks.md',
    content: '- [x] Implement greet in `src/demo.ts`\n',
    language: 'markdown',
  },
  {
    name: '.aide/specs/intent-demo/acceptance.md',
    content: '- [x] greet returns Hello\n',
    language: 'markdown',
  },
  {
    name: 'src/demo.ts',
    content: 'export function greet() { return "Hello" }\n',
    language: 'typescript',
  },
  {
    name: '.aide/meta/runtime-state.json',
    content: JSON.stringify({
      version: 1,
      activeSpecPath: '.aide/specs/intent-demo/tasks.md',
    }),
    language: 'json',
  },
]

describe('proofOfDoneReportService', () => {
  it('builds proof paths under .aide/reports', () => {
    const paths = buildProofReportPaths('.aide/specs/intent-demo/tasks.md', new Date('2026-06-05T10:00:00.000Z'))
    expect(paths.md).toBe('.aide/reports/proof-intent-demo-2026-06-05T10-00-00.md')
    expect(paths.html).toContain('.html')
  })

  it('resolves tasks path from runtime state', () => {
    const path = resolveProofTasksPath(FILES, [])
    expect(path).toBe('.aide/specs/intent-demo/tasks.md')
  })

  it('includes deliverable snapshot and graph in markdown', () => {
    const md = buildProofOfDoneMarkdown({
      tasksPath: '.aide/specs/intent-demo/tasks.md',
      files: FILES,
      completedTasks: ['Implement greet in `src/demo.ts`'],
      acceptanceVerify: { ok: true, uncheckedItems: [], commandResults: [], failures: [] },
    })
    expect(md).toContain('# Proof of Done Report')
    expect(md).toContain('src/demo.ts')
    expect(md).toContain('"kind": "spec-task"')
    expect(md).toContain('Verify: PASSED')
  })

  it('collects referenced deliverable paths', () => {
    const snapshots = collectDeliverableSnapshots(FILES, '.aide/specs/intent-demo/tasks.md')
    expect(snapshots.some((row) => row.path === 'src/demo.ts')).toBe(true)
  })

  it('builds branded html document', () => {
    const html = buildProofOfDoneHtml({
      tasksPath: '.aide/specs/intent-demo/tasks.md',
      files: FILES,
    })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('AI IDE · Intent OS')
    expect(html).toContain('intent-demo')
    expect(html).toContain('Completed Tasks')
  })
})
