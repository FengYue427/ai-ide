import { describe, expect, it } from 'vitest'
import {
  buildGoalDrivenSpecBundle,
  decomposeGoalToTaskLines,
  prepareGoalDrivenWorkspace,
  slugifyGoalForSpecName,
} from './goalDriveAutopilotService'

describe('goalDriveAutopilotService', () => {
  it('slugifies goal text', () => {
    expect(slugifyGoalForSpecName('Add login API')).toBe('add-login-api')
  })

  it('decomposes goal into task lines', () => {
    const tasks = decomposeGoalToTaskLines('实现登录；补集成测试', 'zh-CN')
    expect(tasks.length).toBeGreaterThanOrEqual(2)
    expect(tasks.some((t) => t.includes('登录'))).toBe(true)
  })

  it('builds spec bundle with goal in requirements', () => {
    const bundle = buildGoalDrivenSpecBundle('Ship refresh token', 'en-US')
    const req = bundle.files.find((f) => f.path.endsWith('/requirements.md'))
    expect(req?.content).toContain('Ship refresh token')
    const tasks = bundle.files.find((f) => f.path.endsWith('/tasks.md'))
    expect(tasks?.content).toContain('- [ ]')
  })

  it('reuses open spec when present', () => {
    const files = [
      {
        name: '.aide/specs/auth/tasks.md',
        content: '- [ ] Wire OAuth\n- [x] Done\n',
        language: 'markdown',
      },
      {
        name: '.aide/specs/auth/requirements.md',
        content: '# Requirements\n\n## Goals\n\n- \n',
        language: 'markdown',
      },
    ]
    const result = prepareGoalDrivenWorkspace(files, 'Add SSO', 'en-US')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.created).toBe(false)
    expect(result.tasksPath).toBe('.aide/specs/auth/tasks.md')
    expect(result.openTasks).toBe(1)
  })

  it('creates new spec when none runnable', () => {
    const result = prepareGoalDrivenWorkspace([], 'Build billing webhook', 'en-US')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.created).toBe(true)
    expect(result.openTasks).toBeGreaterThan(0)
  })
})
