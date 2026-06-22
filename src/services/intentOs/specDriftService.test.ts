import { describe, expect, it } from 'vitest'
import { scanSpecDrift } from './specDriftService'

describe('scanSpecDrift', () => {
  it('reports open tasks and unchecked acceptance', () => {
    const report = scanSpecDrift(
      [
        {
          name: '.aide/specs/demo/tasks.md',
          content: '- [ ] Implement greet\n- [x] Done',
          language: 'markdown',
        },
        {
          name: '.aide/specs/demo/acceptance.md',
          content: '- [ ] greet returns Hello',
          language: 'markdown',
        },
      ],
      '.aide/specs/demo/tasks.md',
      new Date('2026-06-05T00:00:00.000Z'),
    )

    expect(report.severity).toBe('info')
    expect(report.items.some((item) => item.kind === 'open-task' && item.count === 1)).toBe(true)
    expect(report.items.some((item) => item.kind === 'open-acceptance' && item.count === 1)).toBe(true)
  })

  it('warns when task references missing path', () => {
    const report = scanSpecDrift(
      [
        {
          name: '.aide/specs/demo/tasks.md',
          content: '- [ ] Update `src/missing.ts`',
          language: 'markdown',
        },
      ],
      '.aide/specs/demo/tasks.md',
    )

    expect(report.severity).toBe('warn')
    expect(report.items.some((item) => item.kind === 'missing-path' && item.path === 'src/missing.ts')).toBe(
      true,
    )
  })
})
