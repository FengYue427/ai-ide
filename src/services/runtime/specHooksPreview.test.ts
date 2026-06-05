import { describe, expect, it } from 'vitest'
import { buildSpecHooksPreview } from './specHooksPreview'

const HOOKS = `version: 1
hooks:
  - id: lint
    on: queue.before
    run: shell
    command: npm run lint
`

describe('specHooksPreview', () => {
  it('returns missing when hooks.yaml absent', () => {
    const preview = buildSpecHooksPreview(
      [{ name: '.aide/specs/demo/tasks.md', content: '# Demo\n- [ ] x' }],
      '.aide/specs/demo/tasks.md',
    )
    expect(preview.exists).toBe(false)
    expect(preview.hooksPath).toBe('.aide/specs/demo/hooks.yaml')
    expect(preview.previewLines).toHaveLength(0)
  })

  it('builds preview lines for valid hooks.yaml', () => {
    const preview = buildSpecHooksPreview(
      [
        { name: '.aide/specs/demo/tasks.md', content: '# Demo\n- [ ] x' },
        { name: '.aide/specs/demo/hooks.yaml', content: HOOKS },
      ],
      '.aide/specs/demo/tasks.md',
    )
    expect(preview.exists).toBe(true)
    expect(preview.parse.ok).toBe(true)
    expect(preview.previewLines[0]).toContain('lint')
    expect(preview.previewLines[0]).toContain('queue.before')
  })

  it('surfaces parse errors in preview state', () => {
    const preview = buildSpecHooksPreview(
      [
        { name: '.aide/specs/demo/tasks.md', content: '# Demo' },
        { name: '.aide/specs/demo/hooks.yaml', content: 'hooks:\n  - id: bad\n    on: never\n    run: shell\n    command: x' },
      ],
      '.aide/specs/demo/tasks.md',
    )
    expect(preview.exists).toBe(true)
    expect(preview.parse.ok).toBe(false)
    expect(preview.previewLines).toHaveLength(0)
    expect(preview.parse.errors.length).toBeGreaterThan(0)
  })
})
