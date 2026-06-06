import { describe, expect, it } from 'vitest'
import { buildDefaultHooksYaml, upsertHooksFileInWorkspace, validateSpecHooksYaml } from './specArtifactsService'

describe('specArtifactsService', () => {
  it('validates default hooks template', () => {
    const validation = validateSpecHooksYaml(buildDefaultHooksYaml('demo'), '.aide/specs/demo/tasks.md')
    expect(validation.ok).toBe(true)
    expect(validation.hooksPath).toBe('.aide/specs/demo/hooks.yaml')
  })

  it('upserts hooks file when valid', () => {
    const content = buildDefaultHooksYaml('auth')
    const result = upsertHooksFileInWorkspace([], '.aide/specs/auth/tasks.md', content)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.files).toHaveLength(1)
      expect(result.files[0]?.name).toBe('.aide/specs/auth/hooks.yaml')
    }
  })

  it('rejects invalid hooks yaml', () => {
    const result = upsertHooksFileInWorkspace([], '.aide/specs/auth/tasks.md', 'version: 2\nhooks: []\n')
    expect(result.ok).toBe(false)
  })
})
