interface FileLike {
  name: string
  content: string
}

export interface PlanExecutionBackfill {
  planPath: string
  stepText: string
  runId?: string | null
  assistantOutput: string
  now?: Date
  provider?: string
  model?: string
}

export function buildPlanExecutionBackfillMarkdown(input: PlanExecutionBackfill): string {
  const trimmed = input.assistantOutput.trim()
  if (!trimmed) return ''
  const date = (input.now ?? new Date()).toISOString()
  const runLine = input.runId ? `- Run ID: ${input.runId}\n` : ''
  const providerLine = input.provider ? `- Provider: ${input.provider}\n` : ''
  const modelLine = input.model ? `- Model: ${input.model}\n` : ''
  const summary = trimmed.split(/\r?\n/)[0]?.slice(0, 200) || ''
  const summaryLine = summary ? `- Summary: ${summary}\n` : ''
  return `\n\n---\n## Plan Step Execution (${date})\n- Step: ${input.stepText}\n${runLine}${providerLine}${modelLine}${summaryLine}\n### Assistant Output\n\n${trimmed}\n`
}

export function appendPlanExecutionBackfill<T extends FileLike>(
  files: T[],
  backfill: PlanExecutionBackfill,
): T[] {
  const addition = buildPlanExecutionBackfillMarkdown(backfill)
  if (!addition) return files
  return files.map((file) =>
    file.name === backfill.planPath
      ? { ...file, content: `${file.content}${addition}` }
      : file,
  )
}
