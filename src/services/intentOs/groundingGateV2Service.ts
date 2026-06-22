import type { FileItem } from '../../types/file'
import { runGroundingGate, type GroundingGateResult } from './groundingGateService'

const SYMBOL_REF = /\b(?:function|class|interface|type)\s+([A-Za-z_$][\w$]*)/g

function extractSymbolRefs(text: string): string[] {
  const refs = new Set<string>()
  SYMBOL_REF.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = SYMBOL_REF.exec(text)) !== null) {
    refs.add(match[1]!)
  }
  return [...refs]
}

/** C4 — extends v1 with coarse symbol mentions in task text (opt-in via tier flag). */
export function runGroundingGateV2(
  files: FileItem[],
  tasksPath: string,
  taskText: string,
): GroundingGateResult {
  const base = runGroundingGate(files, tasksPath, taskText)
  if (!base.ok) return base

  const symbols = extractSymbolRefs(taskText)
  if (symbols.length === 0) return base

  const haystack = files
    .filter((file) => !file.name.replace(/\\/g, '/').includes('.aide/specs/'))
    .map((file) => file.content)
    .join('\n')
  const missing = symbols.filter((symbol) => !haystack.includes(symbol))
  if (missing.length === 0) return base

  return {
    ok: false,
    issues: [
      ...base.issues,
      {
        kind: 'missing-path',
        detail: `referenced symbol(s) not found in workspace: ${missing.slice(0, 3).join(', ')}`,
      },
    ],
    summary: `Grounding v2: missing symbols (${missing.length})`,
  }
}
