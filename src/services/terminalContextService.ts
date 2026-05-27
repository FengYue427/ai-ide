import type { Language } from '../i18n'
import { getRecentTerminalLines } from './terminalBridge'

export function buildTerminalContextSection(maxLines: number, language: Language): string {
  const lines = getRecentTerminalLines(maxLines)
  if (lines.length === 0) return ''

  const body = lines.join('\n').slice(0, 8000)
  if (language === 'en-US') {
    return [
      '## Recent terminal output (read-only summary; not full Cascade awareness)',
      `Last ${lines.length} line(s):`,
      '```',
      body,
      '```',
    ].join('\n')
  }

  return [
    '## 终端最近输出（只读摘要，非 Cascade 全感知）',
    `最近 ${lines.length} 行：`,
    '```',
    body,
    '```',
  ].join('\n')
}
