import type { Language } from '../i18n'
import { getIndexBuildTelemetry } from '../lib/indexBuildTelemetry'
import { isIndexBuildTelemetryEnabled } from '../lib/v13Features'
import { projectIndexManager } from './projectIndexManager'
import type { IndexBuildStats } from './projectIndexService'

/** v1.3.3 — keep Agent index section within chat payload budget. */
export const AGENT_INDEX_CONTEXT_MAX_CHARS = 1200

export function trimAgentIndexContextSection(text: string, maxChars = AGENT_INDEX_CONTEXT_MAX_CHARS): string {
  if (text.length <= maxChars) return text
  const lines = text.split('\n')
  const header = lines[0] ?? ''
  const kept: string[] = [header]
  let size = header.length
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const next = size + line.length + 1
    if (next > maxChars - 24) break
    kept.push(line)
    size = next
  }
  const note =
    header.startsWith('## 项目')
      ? '…（索引摘要已截断以控制上下文体积）'
      : '…(index summary trimmed for context budget)'
  kept.push(note)
  return kept.join('\n')
}

/** v1.3 F5 — compact index stats for Agent system prompt. */
export function buildAgentIndexContextSection(
  language: Language,
  stats?: IndexBuildStats,
): string {
  const indexStats = stats ?? projectIndexManager.getIndexStats()
  const telemetry = isIndexBuildTelemetryEnabled() ? getIndexBuildTelemetry() : null
  const symbolCount = projectIndexManager.getIndex().files.reduce((n, f) => n + f.symbols.length, 0)

  if (language === 'en-US') {
    const lines = [
      '## Project index',
      `- Indexed files: ${indexStats.indexedFiles} / ${indexStats.eligibleFiles}${indexStats.capped ? ' (capped)' : ''}`,
      `- Symbols: ${symbolCount}`,
    ]
    if (telemetry?.lastDurationMs != null) {
      lines.push(
        `- Last index build: ${telemetry.lastDurationMs}ms (${telemetry.lastMode ?? 'unknown'})`,
      )
    }
    return trimAgentIndexContextSection(lines.join('\n'))
  }

  const lines = [
    '## 项目索引',
    `- 已索引文件：${indexStats.indexedFiles} / ${indexStats.eligibleFiles}${indexStats.capped ? '（已截断）' : ''}`,
    `- 符号数：${symbolCount}`,
  ]
  if (telemetry?.lastDurationMs != null) {
    lines.push(`- 上次索引耗时：${telemetry.lastDurationMs}ms（${telemetry.lastMode ?? 'unknown'}）`)
  }
  return trimAgentIndexContextSection(lines.join('\n'))
}
