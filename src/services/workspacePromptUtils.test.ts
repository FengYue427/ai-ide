import { describe, expect, it } from 'vitest'
import {
  buildWorkspaceFileCatalog,
  formatFileSize,
  summarizeFileContent,
} from './workspacePromptUtils'

describe('workspacePromptUtils', () => {
  it('summarizeFileContent truncates long files', () => {
    const content = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join('\n')
    const summary = summarizeFileContent(content, 3)
    expect(summary).toContain('line 1')
    expect(summary).toContain('省略 17 行')
  })

  it('buildWorkspaceFileCatalog marks selection', () => {
    const catalog = buildWorkspaceFileCatalog([
      { path: 'src/a.ts', language: 'typescript', size: 120, selected: true },
      { path: 'src/b.ts', language: 'typescript', size: 240, selected: false },
    ])
    expect(catalog).toContain('✓ src/a.ts')
    expect(catalog).toContain('○ src/b.ts')
  })

  it('formatFileSize uses human units', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })
})
