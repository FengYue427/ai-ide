import type { Language } from '../i18n'

export const SPECS_ROOT = '.aide/specs'
export const SPEC_FILE_NAMES = ['requirements.md', 'design.md', 'tasks.md', 'acceptance.md'] as const

export type SpecFileName = (typeof SPEC_FILE_NAMES)[number]

export interface SpecTemplateFile {
  path: string
  content: string
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

export function isSpecFilePath(path: string): boolean {
  const normalized = normalizePath(path)
  return /^\.aide\/specs\/[^/]+\/(requirements|design|tasks|acceptance)\.md$/i.test(normalized)
}

export function collectSpecSources(
  editorFiles: { name: string; content: string }[],
  workspaceFiles: { path: string; content: string }[] = [],
): { path: string; content: string }[] {
  return [
    ...editorFiles.map((file) => ({ path: file.name, content: file.content })),
    ...workspaceFiles.map((file) => ({ path: file.path, content: file.content })),
  ].filter((item) => isSpecFilePath(item.path))
}

export function appendSpecsContext(basePrompt: string, sources: { path: string; content: string }[], locale: Language = 'zh-CN'): string {
  if (sources.length === 0) return basePrompt
  const lines = sources
    .filter((item) => item.content.trim().length > 0)
    .slice(0, 16)
    .map((item) => `### ${normalizePath(item.path)}\n${item.content.trim()}`)
  if (lines.length === 0) return basePrompt
  const title = locale === 'zh-CN' ? '规格上下文（Specs）' : 'Specs Context'
  return `${basePrompt}\n\n## ${title}\n\n${lines.join('\n\n')}\n`
}

export function buildSpecTemplateFiles(specName: string): SpecTemplateFile[] {
  const normalizedName = specName.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').toLowerCase() || 'new-spec'
  const base = `${SPECS_ROOT}/${normalizedName}`
  const now = new Date().toISOString().slice(0, 10)
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements\n\n- Spec: ${normalizedName}\n- Date: ${now}\n\n## Goals\n\n- \n\n## Non-goals\n\n- \n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Architecture\n\n- \n\n## Data flow\n\n- \n\n## Risks\n\n- \n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Define acceptance criteria\n- [ ] Implement core flow\n- [ ] Add tests\n- [ ] Update docs\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance Checklist\n\n- [ ] Feature behavior matches requirements\n- [ ] Key test cases pass\n- [ ] Docs/release notes updated\n`,
    },
  ]
}
