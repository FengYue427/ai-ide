export interface SpecExecutionLogMeta {
  runId?: string | null
  provider?: string
  model?: string
}

export function buildSpecExecutionLog(
  taskText: string,
  assistantOutput: string,
  now = new Date(),
  meta?: SpecExecutionLogMeta,
): string {
  const maxChars = 8000
  const trimmed = assistantOutput.trim()
  if (!trimmed) return ''
  const date = now.toISOString().slice(0, 10)
  const snippet = trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}\n\n... (truncated)` : trimmed
  const metaLines = [
    meta?.runId ? `- Run ID: ${meta.runId}` : '',
    meta?.provider ? `- Provider: ${meta.provider}` : '',
    meta?.model ? `- Model: ${meta.model}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const metaBlock = metaLines ? `${metaLines}\n` : ''
  return `\n\n---\n## Spec Execution Log (${date})\n- Task: ${taskText}\n${metaBlock}\n### Assistant Output\n\n${snippet}\n`
}
