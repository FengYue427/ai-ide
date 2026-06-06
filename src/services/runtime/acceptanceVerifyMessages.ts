/** v1.5.3 — user-facing acceptance verify failure copy. */

import type { AcceptanceVerifyResult } from './acceptanceRunner'

export function formatAcceptanceVerifyFailures(result: AcceptanceVerifyResult): string {
  const lines: string[] = []

  if (result.uncheckedItems.length > 0) {
    lines.push(`未完成验收项（${result.uncheckedItems.length}）：`)
    for (const item of result.uncheckedItems.slice(0, 5)) {
      lines.push(`· ${item}`)
    }
    if (result.uncheckedItems.length > 5) {
      lines.push(`… 另有 ${result.uncheckedItems.length - 5} 项`)
    }
  }

  const failedCommands = result.commandResults.filter((row) => row.status === 'fail')
  if (failedCommands.length > 0) {
    lines.push(`命令失败（${failedCommands.length}）：`)
    for (const row of failedCommands.slice(0, 3)) {
      lines.push(`· ${row.command}${row.detail ? ` (${row.detail})` : ''}`)
    }
  }

  if (lines.length === 0 && result.failures.length > 0) {
    return result.failures.slice(0, 3).join('\n')
  }

  return lines.join('\n') || 'acceptance.md 验收未通过'
}
