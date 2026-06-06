/** v1.5 F3 — Spec artifacts (hooks.yaml validate · upsert). */

import type { FileItem } from '../../types/file'
import {
  hooksPathFromTasksPath,
  parseHooksYaml,
  type HooksParseResult,
} from './hooksSchema'
import { validateHooksDocumentJsonSchema } from './hooksJsonSchema'

export interface SpecArtifactsValidation {
  ok: boolean
  hooksPath: string
  parse: HooksParseResult
  schemaErrors: string[]
}

export function buildDefaultHooksYaml(specName: string): string {
  return `# .aide/specs/${specName}/hooks.yaml
version: 1
hooks:
  - id: pre-run-tests
    on: queue.before
    run: shell
    command: npm run test:local
  - id: post-apply-lint
    on: apply.after
    run: agent
    prompt: "对刚应用的文件跑 lint 并修复明显问题"
`
}

export function validateSpecHooksYaml(content: string, tasksPath: string): SpecArtifactsValidation {
  const hooksPath = hooksPathFromTasksPath(tasksPath)
  const parse = parseHooksYaml(content)
  if (!parse.ok || !parse.document) {
    return { ok: false, hooksPath, parse, schemaErrors: [] }
  }
  const schemaErrors = validateHooksDocumentJsonSchema(parse.document)
  return {
    ok: schemaErrors.length === 0,
    hooksPath,
    parse,
    schemaErrors,
  }
}

export function upsertHooksFileInWorkspace(
  files: FileItem[],
  tasksPath: string,
  content: string,
): { ok: true; files: FileItem[] } | { ok: false; errors: string[] } {
  const validation = validateSpecHooksYaml(content, tasksPath)
  if (!validation.ok) {
    const errors = [
      ...validation.parse.errors,
      ...validation.schemaErrors,
    ]
    return { ok: false, errors }
  }

  const hooksPath = validation.hooksPath
  const next = [...files]
  const index = next.findIndex((file) => file.name === hooksPath)
  const row = { name: hooksPath, content, language: 'yaml' as const }
  if (index >= 0) {
    next[index] = { ...next[index], ...row }
  } else {
    next.push(row)
  }
  return { ok: true, files: next }
}
