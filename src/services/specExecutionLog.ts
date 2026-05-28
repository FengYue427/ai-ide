export function buildSpecExecutionLog(taskText: string, assistantOutput: string, now = new Date()): string {
  const maxChars = 8000
  const trimmed = assistantOutput.trim()
  if (!trimmed) return ''
  const date = now.toISOString().slice(0, 10)
  const snippet = trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}\n\n... (truncated)` : trimmed
  return `\n\n---\n## Spec Execution Log (${date})\n- Task: ${taskText}\n\n### Assistant Output\n\n${snippet}\n`
}
