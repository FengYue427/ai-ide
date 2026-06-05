import type { Language } from '../i18n'
import { getIndexBuildTelemetry } from '../lib/indexBuildTelemetry'
import { isIndexBuildTelemetryEnabled } from '../lib/v13Features'
import { projectIndexManager } from './projectIndexManager'
import type { IndexBuildStats } from './projectIndexService'

/** v1.3 F5 — compact index stats for Agent system prompt. */
export function buildAgentIndexContextSection(
  language: Language,
  stats?: IndexBuildStats,
): string {
  const indexStats = stats ?? projectIndexManager.getIndexStats()
  const telemetry = isIndexBuildTelemetryEnabled() ? getIndexBuildTelemetry() : null

  if (language === 'en-US') {
    const lines = [
      '## Project index',
      `- Indexed files: ${indexStats.indexedFiles} / ${indexStats.eligibleFiles}${indexStats.capped ? ' (capped)' : ''}`,
      `- Symbols: ${projectIndexManager.getIndex().files.reduce((n, f) => n + f.symbols.length, 0)}`,
    ]
    if (telemetry?.lastDurationMs != null) {
      lines.push(
        `- Last index build: ${telemetry.lastDurationMs}ms (${telemetry.lastMode ?? 'unknown'})`,
      )
    }
    return lines.join('\n')
  }

  const lines = [
    '## 项目索引',
    `- 已索引文件：${indexStats.indexedFiles} / ${indexStats.eligibleFiles}${indexStats.capped ? '（已截断）' : ''}`,
    `- 符号数：${projectIndexManager.getIndex().files.reduce((n, f) => n + f.symbols.length, 0)}`,
  ]
  if (telemetry?.lastDurationMs != null) {
    lines.push(`- 上次索引耗时：${telemetry.lastDurationMs}ms（${telemetry.lastMode ?? 'unknown'}）`)
  }
  return lines.join('\n')
}
