import { describe, expect, it } from 'vitest'
import {
  evaluateDemoGreetFile,
  isIntentDemoSpecPath,
  markIntentDemoLevelComplete,
} from './intentDemoAcceptanceService'

describe('intentDemoAcceptanceService', () => {
  it('detects intent demo spec path', () => {
    expect(isIntentDemoSpecPath('.aide/specs/intent-demo/tasks.md')).toBe(true)
    expect(isIntentDemoSpecPath('.aide/specs/other/tasks.md')).toBe(false)
  })

  it('evaluates greet implementation', () => {
    expect(evaluateDemoGreetFile("export function greet(n: string) { return 'Hello ' + n }").ok).toBe(true)
    expect(evaluateDemoGreetFile('export function foo() {}').ok).toBe(false)
  })

  it('marks demo acceptance when greet is ready', () => {
    const result = markIntentDemoLevelComplete(
      [
        {
          name: 'src/demo.ts',
          content: "export function greet(name: string) { return `Hello ${name}` }",
          language: 'typescript',
        },
        {
          name: '.aide/specs/intent-demo/tasks.md',
          content: '# Tasks\n\n- [ ] 创建 `src/demo.ts` 并实现 greet\n',
          language: 'markdown',
        },
        {
          name: '.aide/specs/intent-demo/acceptance.md',
          content: '# Acceptance\n\n- [ ] greet returns Hello\n',
          language: 'markdown',
        },
      ],
      {
        taskPath: '.aide/specs/intent-demo/tasks.md',
        taskText: '创建 `src/demo.ts` 并实现 greet',
        specAcceptancePath: '.aide/specs/intent-demo/acceptance.md',
      },
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.files.find((f) => f.name.endsWith('acceptance.md'))?.content).toContain('- [x]')
      expect(result.files.find((f) => f.name.endsWith('tasks.md'))?.content).toContain('- [x]')
    }
  })
})
