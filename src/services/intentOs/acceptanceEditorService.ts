/** B4 — structured acceptance.md criteria editing. */

const CHECKBOX_LINE = /^(-\s+\[)([ xX])(\]\s+)(.+)$/

export interface AcceptanceCriterion {
  /** Line index in the split source (CRLF-safe). */
  lineIndex: number
  text: string
  checked: boolean
}

export function acceptancePathFromTasksPath(tasksPath: string): string {
  return tasksPath.replace(/[\\/]tasks\.md$/i, '/acceptance.md')
}

export function parseAcceptanceCriteria(content: string): AcceptanceCriterion[] {
  const lines = content.split(/\r?\n/)
  const items: AcceptanceCriterion[] = []
  lines.forEach((line, lineIndex) => {
    const match = line.match(CHECKBOX_LINE)
    if (!match?.[4]) return
    items.push({
      lineIndex,
      text: match[4].trim(),
      checked: match[2].toLowerCase() === 'x',
    })
  })
  return items
}

export function setAcceptanceCriterionChecked(
  content: string,
  lineIndex: number,
  checked: boolean,
): string {
  const lines = content.split(/\r?\n/)
  const line = lines[lineIndex]
  if (line == null) return content
  const match = line.match(CHECKBOX_LINE)
  if (!match) return content
  const mark = checked ? 'x' : ' '
  lines[lineIndex] = `${match[1]}${mark}${match[3]}${match[4]}`
  return lines.join('\n')
}
