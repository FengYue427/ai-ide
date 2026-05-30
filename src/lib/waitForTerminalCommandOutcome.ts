import { getTerminalOutputLines } from './terminalSession'
import { detectCommandOutcome } from './npmScriptRun'

export async function waitForTerminalCommandOutcome(options: {
  baselineLineCount: number
  timeoutMs?: number
  pollMs?: number
}): Promise<{ exitCode?: number; failed: boolean; timedOut: boolean }> {
  const { baselineLineCount, timeoutMs = 120_000, pollMs = 250 } = options
  const deadline = Date.now() + timeoutMs
  let lastSize = baselineLineCount
  let stableSince = Date.now()
  const stableWindowMs = 1500

  while (Date.now() < deadline) {
    const lines = getTerminalOutputLines()
    const newLines = lines.slice(baselineLineCount)
    const outcome = detectCommandOutcome(newLines)
    if (outcome.exitCode !== undefined || (outcome.failed && newLines.length > 0)) {
      return { ...outcome, timedOut: false }
    }

    if (lines.length === lastSize) {
      if (Date.now() - stableSince >= stableWindowMs && newLines.length > 0) {
        return { ...outcome, timedOut: false }
      }
    } else {
      lastSize = lines.length
      stableSince = Date.now()
    }

    await new Promise((resolve) => setTimeout(resolve, pollMs))
  }

  const newLines = getTerminalOutputLines().slice(baselineLineCount)
  const outcome = detectCommandOutcome(newLines)
  return { ...outcome, timedOut: true }
}
