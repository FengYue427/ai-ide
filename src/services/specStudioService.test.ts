import { describe, expect, it } from 'vitest'
import {
  buildSpecStudioExecutePrompt,
  buildSpecStudioRefinePrompt,
  createSpecStudioBundle,
  detectRecommendedSpecTemplate,
  listSpecStudioTemplates,
} from './specStudioService'

describe('specStudioService', () => {
  it('lists stack templates', () => {
    expect(listSpecStudioTemplates().length).toBeGreaterThanOrEqual(10)
  })

  it('creates node bundle with hooks', () => {
    const bundle = createSpecStudioBundle('node-api', 'Auth Refactor', 'zh-CN')
    expect(bundle.files.some((f) => f.path.endsWith('/hooks.yaml'))).toBe(true)
    expect(bundle.tasksPath).toBe('.aide/specs/auth-refactor/tasks.md')
    expect(bundle.specSlug).toBe('auth-refactor')
  })

  it('creates blank spec without hooks', () => {
    const bundle = createSpecStudioBundle('blank', 'demo', 'en-US')
    expect(bundle.hooksYaml).toBeNull()
    expect(bundle.files).toHaveLength(4)
  })

  it('detects java from pom.xml', () => {
    expect(detectRecommendedSpecTemplate(['src/Main.java', 'pom.xml'])).toBe('java-service')
  })

  it('detects go from go.mod', () => {
    expect(detectRecommendedSpecTemplate(['go.mod'])).toBe('go-service')
  })

  it('detects rust from Cargo.toml', () => {
    expect(detectRecommendedSpecTemplate(['Cargo.toml'])).toBe('rust-crate')
  })

  it('detects node from package.json', () => {
    expect(detectRecommendedSpecTemplate(['package.json'])).toBe('node-api')
  })

  it('builds refine prompt with user goal', () => {
    const prompt = buildSpecStudioRefinePrompt('node-bugfix', 'fix-login', 'fix 401 on refresh', 'en-US')
    expect(prompt).toContain('fix-login')
    expect(prompt).toContain('fix 401 on refresh')
  })

  it('builds execute prompt', () => {
    const prompt = buildSpecStudioExecutePrompt('.aide/specs/x/tasks.md', 'zh-CN')
    expect(prompt).toContain('.aide/specs/x/tasks.md')
  })
})
