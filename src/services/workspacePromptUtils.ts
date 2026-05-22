/** Helpers for compact workspace context in AI system prompts. */

import { createTranslator, type Language } from '../i18n'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function summarizeFileContent(content: string, maxLines = 8, locale: Language = 'zh-CN'): string {
  const t = createTranslator(locale)
  const lines = content.split(/\r?\n/)
  if (lines.length <= maxLines) return content.trimEnd()

  const head = lines.slice(0, maxLines).join('\n')
  return `${head}\n${t('prompt.ws.omittedLines', { skipped: lines.length - maxLines, total: lines.length })}`
}

export function buildWorkspaceFileCatalog(
  files: { path: string; language: string; size: number; selected?: boolean }[],
  locale: Language = 'zh-CN',
): string {
  const t = createTranslator(locale)
  if (files.length === 0) return t('prompt.ws.noFiles')

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))
  return sorted
    .map((file) => {
      const flag = file.selected !== false ? '✓' : '○'
      return `${flag} ${file.path} (${file.language}, ${formatFileSize(file.size)})`
    })
    .join('\n')
}
