import type { Language } from '../i18n'
import type { AgentSettings } from './agentSettingsService'
import { buildAgentIndexContextSection } from './agentIndexContextSection'
import { buildTerminalContextSection } from './terminalContextService'

export function buildEditorFocusSection(activeFilePath: string | null, language: Language): string {
  if (!activeFilePath?.trim()) return ''

  if (language === 'en-US') {
    return `## Editor focus\nCurrently open in the editor: \`${activeFilePath.trim()}\``
  }
  return `## 编辑器焦点\n当前打开文件：\`${activeFilePath.trim()}\``
}

/** Agent / Chat system prompt extras (1.0.4 E2 lite). */
export function appendAgentContextSections(
  basePrompt: string,
  options: {
    language: Language
    activeFilePath: string | null
    agentSettings: AgentSettings
  },
): string {
  let prompt = basePrompt

  const focus = buildEditorFocusSection(options.activeFilePath, options.language)
  if (focus) prompt = `${prompt}\n\n${focus}`

  if (options.agentSettings.injectTerminalContext) {
    const terminal = buildTerminalContextSection(options.agentSettings.terminalContextMaxLines, options.language)
    if (terminal) prompt = `${prompt}\n\n${terminal}`
  }

  const indexSection = buildAgentIndexContextSection(options.language)
  if (indexSection) prompt = `${prompt}\n\n${indexSection}`

  return prompt
}
