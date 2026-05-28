interface FileLike {
  name: string
  content: string
}

export function markPlanStepDoneLine(content: string, line: number): string {
  const lines = content.split(/\r?\n/)
  const index = line - 1
  if (index < 0 || index >= lines.length) return content
  lines[index] = lines[index].replace(/^(\s*-\s*)\[\s\]/, '$1[x]')
  return lines.join('\n')
}

export function markPlanStepDoneByText(content: string, stepText: string): string {
  const escaped = stepText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^(\\s*-\\s*)\\[\\s\\]\\s+${escaped}\\s*$`, 'm')
  return content.replace(re, '$1[x] ' + stepText)
}

export function markPlanStepDone<T extends FileLike>(
  files: T[],
  planPath: string,
  step: { line?: number; text: string },
): T[] {
  return files.map((file) => {
    if (file.name !== planPath) return file
    const next = step.line ? markPlanStepDoneLine(file.content, step.line) : markPlanStepDoneByText(file.content, step.text)
    return next === file.content ? file : { ...file, content: next }
  })
}

