import { describe, expect, it } from 'vitest'
import { createLinkedPlanForSpec, buildPlanSkeletonContentForSpec } from './specPlanBridgeService'
import { readPlanSpecLinks } from './planSpecLinkService'

describe('specPlanBridgeService', () => {
  it('builds plan skeleton from spec tasks', () => {
    const content = buildPlanSkeletonContentForSpec(
      'auth',
      '.aide/specs/auth/tasks.md',
      ['Add API', 'Add tests'],
      'en-US',
    )
    expect(content).toContain('Linked Spec')
    expect(content).toContain('- [ ] Add API')
  })

  it('creates plan file and plan-spec link', () => {
    const files = [
      {
        name: '.aide/specs/demo/tasks.md',
        content: '# Tasks\n\n- [ ] Ship feature\n- [x] Done\n',
        language: 'markdown',
      },
    ]
    const result = createLinkedPlanForSpec(files, {
      specSlug: 'demo',
      tasksPath: '.aide/specs/demo/tasks.md',
    })
    expect(result).not.toBeNull()
    expect(result!.planPath).toMatch(/^\.aide\/plans\//)
    const links = readPlanSpecLinks(result!.files)
    expect(links).toHaveLength(1)
    expect(links[0].specTaskText).toBe('Ship feature')
  })
})
