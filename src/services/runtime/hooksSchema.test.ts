import { describe, expect, it } from 'vitest'
import {
  hooksPathFromTasksPath,
  parseHooksYaml,
  formatHooksPreviewLines,
} from './hooksSchema'

const SAMPLE = `version: 1
hooks:
  - id: pre-run-tests
    on: queue.before
    run: shell
    command: npm run test:local
    cwd: \${workspaceRoot}
  - id: on-fail
    on: verify.fail
    run: enqueue
    spec: auth-login
    task: fix acceptance
`

describe('hooksSchema', () => {
  it('maps tasks path to hooks.yaml', () => {
    expect(hooksPathFromTasksPath('.aide/specs/auth/tasks.md')).toBe(
      '.aide/specs/auth/hooks.yaml',
    )
  })

  it('parses valid hooks.yaml', () => {
    const result = parseHooksYaml(SAMPLE)
    expect(result.ok).toBe(true)
    expect(result.document?.hooks).toHaveLength(2)
    expect(result.document?.hooks[0].id).toBe('pre-run-tests')
    expect(result.document?.hooks[1].run).toBe('enqueue')
  })

  it('rejects missing version', () => {
    const result = parseHooksYaml('hooks:\n  - id: x\n    on: queue.before\n    run: shell\n    command: echo')
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('version'))).toBe(true)
  })

  it('rejects invalid on event', () => {
    const result = parseHooksYaml(`version: 1
hooks:
  - id: bad
    on: never
    run: shell
    command: echo hi`)
    expect(result.ok).toBe(false)
  })

  it('formats preview lines', () => {
    const parsed = parseHooksYaml(SAMPLE)
    expect(parsed.document).toBeDefined()
    const lines = formatHooksPreviewLines(parsed.document!)
    expect(lines[0]).toContain('pre-run-tests')
    expect(lines[1]).toContain('verify.fail')
  })
})
