/**
 * Project rules injected into AI system prompts (Cursor-style .cursorrules compat).
 */

import type { Language } from '../i18n'
import { serviceText } from '../lib/serviceI18n'

export function getDefaultProjectRulesTemplate(locale: Language = 'zh-CN'): string {
  return serviceText('projectRules.template', undefined, locale)
}

/** @deprecated Use getDefaultProjectRulesTemplate() */
export const DEFAULT_PROJECT_RULES_TEMPLATE = getDefaultProjectRulesTemplate('zh-CN')

export const PROJECT_RULES_PATH = '.aide/rules.md'

const RULE_PATH_PATTERNS = [
  /^\.aide\/rules$/i,
  /^\.aide\/rules\.md$/i,
  /^aide\.rules\.md$/i,
  /^\.cursorrules$/i,
  /^\.aiderules$/i,
]

export function isProjectRulesPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '')
  return RULE_PATH_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function extractProjectRules(sources: { path: string; content: string }[]): string | null {
  const parts: string[] = []
  for (const source of sources) {
    if (!isProjectRulesPath(source.path)) continue
    const trimmed = source.content.trim()
    if (trimmed) parts.push(trimmed)
  }
  if (parts.length === 0) return null
  return parts.join('\n\n---\n\n')
}

export function appendProjectRules(
  basePrompt: string,
  rules: string | null,
  locale: Language = 'zh-CN',
): string {
  if (!rules?.trim()) return basePrompt
  const title = serviceText('projectRules.sectionTitle', undefined, locale)
  return `${basePrompt}\n\n## ${title}\n\n${rules.trim()}\n`
}

export function collectRulesSources(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[] = [],
): { path: string; content: string }[] {
  return [
    ...editorFiles.map((file) => ({ path: file.name, content: file.content })),
    ...workspaceFiles.map((file) => ({ path: file.path, content: file.content })),
  ]
}
