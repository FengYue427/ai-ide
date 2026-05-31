/** Insert `debugger;` before breakpoint lines (WebContainer CDP fallback, v1.1.7 F2). */

export function injectDebuggerStatementsAtLines(content: string, lines: number[]): string {
  const targets = [...new Set(lines.filter((line) => Number.isFinite(line) && line > 0))].sort(
    (a, b) => b - a,
  )
  if (targets.length === 0) return content

  const split = content.split('\n')
  for (const line of targets) {
    const index = line - 1
    if (index < 0 || index > split.length) continue
    if (split[index]?.trim() === 'debugger;') continue
    split.splice(index, 0, 'debugger;')
  }
  return split.join('\n')
}

export function applyBreakpointInjectionToFile(
  content: string,
  breakpoints: Array<{ line: number; enabled: boolean }>,
): string {
  const lines = breakpoints.filter((bp) => bp.enabled).map((bp) => bp.line)
  return injectDebuggerStatementsAtLines(content, lines)
}
