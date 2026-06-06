import { describe, expect, it } from 'vitest'
import { buildTabPlusPlusContext, appendTabPlusPlusContextToPrompt } from './tabPlusPlusContext'

describe('tabPlusPlusContext', () => {
  it('includes active spec task and related file heads', () => {
    const context = buildTabPlusPlusContext({
      prefix: 'const x = ',
      suffix: '',
      filename: 'src/app.ts',
      openFiles: [
        { name: '.aide/tasks.md', content: '- [ ] Ship Tab++ context' },
        { name: 'src/util.ts', content: 'export function helper() {\n  return 1\n}' },
      ],
      activeSpecPath: '.aide/tasks.md',
    })

    expect(context.activeSpecTaskLine).toContain('Ship Tab++ context')
    expect(context.relatedFileSnippets).toHaveLength(1)
    expect(context.contextFingerprint).toContain('.aide/tasks.md')

    const prompt = appendTabPlusPlusContextToPrompt('Complete code', context)
    expect(prompt).toContain('Active spec task')
    expect(prompt).toContain('Related open files')
  })
})
