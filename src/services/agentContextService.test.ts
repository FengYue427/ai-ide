import { describe, expect, it } from 'vitest'
import { appendAgentContextSections, buildEditorFocusSection } from './agentContextService'
import { DEFAULT_AGENT_SETTINGS } from './agentSettingsService'

describe('agentContextService', () => {
  it('buildEditorFocusSection includes path', () => {
    expect(buildEditorFocusSection('src/app.ts', 'zh-CN')).toContain('src/app.ts')
  })

  it('appendAgentContextSections adds focus when path set', () => {
    const out = appendAgentContextSections('base', {
      language: 'en-US',
      activeFilePath: 'index.ts',
      agentSettings: { ...DEFAULT_AGENT_SETTINGS, injectTerminalContext: false },
    })
    expect(out).toContain('index.ts')
    expect(out.startsWith('base')).toBe(true)
  })
})
