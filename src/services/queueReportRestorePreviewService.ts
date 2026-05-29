import {
  buildQueueRestoreFromReport,
  type QueueRestoreResult,
} from './queueReportRestoreService'

interface FileLike {
  name: string
  content: string
}

export interface QueueRestorePreview {
  planItems: Array<{ planPath: string; stepText: string }>
  specItems: Array<{ taskPath: string; taskText: string }>
  unresolved: string[]
}

export function buildQueueRestorePreview(markdown: string, files: FileLike[]): QueueRestorePreview {
  const result = buildQueueRestoreFromReport(markdown, files)
  return {
    planItems: result.planItems.map((item) => ({
      planPath: item.backfill.planPath,
      stepText: item.backfill.stepText,
    })),
    specItems: result.specItems.map((item) => ({
      taskPath: item.backfill.taskPath,
      taskText: item.backfill.taskText,
    })),
    unresolved: result.unresolved,
  }
}

export function formatQueueRestorePreview(preview: QueueRestorePreview, maxItems = 8): string {
  if (preview.planItems.length === 0 && preview.specItems.length === 0) {
    if (preview.unresolved.length > 0) {
      return `未匹配项：\n${preview.unresolved.slice(0, maxItems).join('\n')}`
    }
    return '报告中没有可恢复的 Plan / Spec 队列项。'
  }

  const lines: string[] = []
  if (preview.planItems.length > 0) {
    lines.push(`Plan 步骤（${preview.planItems.length}）：`)
    preview.planItems.slice(0, maxItems).forEach((item) => {
      lines.push(`- [${item.planPath}] ${item.stepText}`)
    })
    if (preview.planItems.length > maxItems) lines.push(`- … 另有 ${preview.planItems.length - maxItems} 条`)
  }
  if (preview.specItems.length > 0) {
    lines.push(`Spec 任务（${preview.specItems.length}）：`)
    preview.specItems.slice(0, maxItems).forEach((item) => {
      lines.push(`- [${item.taskPath}] ${item.taskText}`)
    })
    if (preview.specItems.length > maxItems) lines.push(`- … 另有 ${preview.specItems.length - maxItems} 条`)
  }
  if (preview.unresolved.length > 0) {
    lines.push(`未匹配（${preview.unresolved.length}）：`)
    preview.unresolved.slice(0, 4).forEach((item) => lines.push(`- ${item}`))
    if (preview.unresolved.length > 4) lines.push(`- …`)
  }
  return lines.join('\n')
}

export function hasQueueRestoreItems(preview: QueueRestorePreview): boolean {
  return preview.planItems.length > 0 || preview.specItems.length > 0
}

export { buildQueueRestoreFromReport, type QueueRestoreResult }
