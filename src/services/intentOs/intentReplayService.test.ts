import { describe, expect, it } from 'vitest'
import {
  buildIntentReplayApplyPlan,
  buildIntentReplayManifest,
  findLatestProofForTasksPath,
  parseIntentGraphFromProofMarkdown,
  parseTasksPathFromProofMarkdown,
} from './intentReplayService'

const SAMPLE_PROOF = `# Proof of Done Report

- Tasks Path: .aide/specs/demo/tasks.md
- Verify: PASSED

## Intent Graph

\`\`\`json
{"nodes":[{"id":"n1","kind":"spec-task","label":"task"}],"edges":[]}
\`\`\`
`

describe('intentReplayService', () => {
  it('parses tasks path and graph json from proof markdown', () => {
    expect(parseTasksPathFromProofMarkdown(SAMPLE_PROOF)).toBe('.aide/specs/demo/tasks.md')
    const graph = parseIntentGraphFromProofMarkdown(SAMPLE_PROOF)
    expect(graph?.nodes).toHaveLength(1)
  })

  it('builds replay manifest from workspace file', () => {
    const manifest = buildIntentReplayManifest(
      [{ name: '.aide/reports/proof-demo.md', content: SAMPLE_PROOF, language: 'markdown' }],
      '.aide/reports/proof-demo.md',
    )
    expect(manifest?.specSlug).toBe('demo')
    expect(manifest?.verifyPassed).toBe(true)
  })

  it('finds latest proof for tasks path', () => {
    const files = [
      { name: '.aide/reports/proof-demo-001.md', content: '- Tasks Path: .aide/specs/demo/tasks.md\n', language: 'markdown' },
      { name: '.aide/reports/proof-demo-002.md', content: '- Tasks Path: .aide/specs/demo/tasks.md\n', language: 'markdown' },
    ]
    expect(findLatestProofForTasksPath(files, '.aide/specs/demo/tasks.md')).toBe('.aide/reports/proof-demo-002.md')
  })

  it('builds replay apply plan', () => {
    const manifest = buildIntentReplayManifest(
      [{ name: '.aide/reports/proof-demo.md', content: SAMPLE_PROOF, language: 'markdown' }],
      '.aide/reports/proof-demo.md',
    )
    expect(manifest).toBeTruthy()
    const plan = buildIntentReplayApplyPlan(manifest!)
    expect(plan.focusTasksPath).toBe('.aide/specs/demo/tasks.md')
    expect(plan.clearFailedSpec).toBe(true)
  })
})
