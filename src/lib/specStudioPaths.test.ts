import { describe, expect, it } from 'vitest'
import {
  isSpecRelatedPath,
  isSpecTasksPath,
  specSlugFromPath,
  tasksPathFromSpecPath,
} from './specStudioPaths'

describe('specStudioPaths', () => {
  it('detects spec tasks path', () => {
    expect(isSpecTasksPath('.aide/specs/auth/tasks.md')).toBe(true)
    expect(isSpecTasksPath('src/index.ts')).toBe(false)
  })

  it('extracts slug and tasks path from spec files', () => {
    expect(specSlugFromPath('.aide/specs/auth/requirements.md')).toBe('auth')
    expect(tasksPathFromSpecPath('.aide/specs/auth')).toBe('.aide/specs/auth/tasks.md')
    expect(tasksPathFromSpecPath('.aide/specs/auth/design.md')).toBe('.aide/specs/auth/tasks.md')
  })

  it('matches spec related paths', () => {
    expect(isSpecRelatedPath('.aide/specs/demo/hooks.yaml')).toBe(true)
    expect(isSpecRelatedPath('.aide/plans/x.md')).toBe(false)
  })
})
