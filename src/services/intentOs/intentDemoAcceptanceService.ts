import type { FileItem } from '../../types/file'
import type { QueuedSpecBackfill } from '../../store/ideStore'
import { parseProjectTasks } from '../projectTasksService'

export const INTENT_DEMO_SPEC_SLUG = 'intent-demo'

export function isIntentDemoSpecPath(tasksPath: string): boolean {
  const normalized = tasksPath.replace(/\\/g, '/').toLowerCase()
  return normalized.includes(`.aide/specs/${INTENT_DEMO_SPEC_SLUG}/`)
}

/** Heuristic check that demo greet is implemented enough for acceptance. */
export function evaluateDemoGreetFile(content: string): { ok: boolean; message?: string } {
  if (!/export\s+function\s+greet\s*\(/m.test(content)) {
    return { ok: false, message: 'missing greet export' }
  }
  const hasHelloReturn =
    /return\s+[`'"][^`'"]*Hello/is.test(content) ||
    /return\s+[`'"][^`'"]*\$\{/s.test(content) ||
    (/Hello/i.test(content) && /return\s+/m.test(content))
  if (!hasHelloReturn) {
    return { ok: false, message: 'greet should return a string containing Hello' }
  }
  return { ok: true }
}

function tickOpenCheckboxes(content: string): string {
  return content.replace(/^- \[ \] /gm, '- [x] ')
}

function tickTaskInMarkdown(content: string, taskText: string): string {
  const needle = taskText.trim().toLowerCase()
  const lines = content.split(/\r?\n/)
  let changed = false
  const next = lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- [ ]')) return line
    const text = trimmed.replace(/^[-*]\s+\[[ xX]\]\s+/, '').trim().toLowerCase()
    if (text === needle || text.includes(needle.slice(0, 12))) {
      changed = true
      return line.replace(/^(\s*[-*]\s+)\[ \]/, '$1[x]')
    }
    return line
  })
  return changed ? next.join('\n') : content
}

export function markIntentDemoLevelComplete(
  files: FileItem[],
  backfill: Pick<QueuedSpecBackfill, 'taskPath' | 'taskText' | 'specAcceptancePath'>,
): { ok: true; files: FileItem[] } | { ok: false; message: string } {
  const demoFile = files.find((f) => f.name.replace(/\\/g, '/') === 'src/demo.ts')
  if (!demoFile) {
    return { ok: false, message: 'src/demo.ts missing' }
  }
  const greet = evaluateDemoGreetFile(demoFile.content)
  if (!greet.ok) {
    return { ok: false, message: greet.message ?? 'greet not ready' }
  }

  const next = files.map((file) => {
    const name = file.name.replace(/\\/g, '/')
    if (name === backfill.specAcceptancePath) {
      return { ...file, content: tickOpenCheckboxes(file.content) }
    }
    if (name === backfill.taskPath) {
      return { ...file, content: tickTaskInMarkdown(file.content, backfill.taskText) }
    }
    return file
  })

  const tasksFile = next.find((f) => f.name.replace(/\\/g, '/') === backfill.taskPath)
  if (!tasksFile) {
    return { ok: false, message: 'tasks file missing' }
  }
  const stillOpen = parseProjectTasks(tasksFile.content).some((t) => t.text.trim().toLowerCase() === backfill.taskText.trim().toLowerCase() && !t.done)
  if (stillOpen) {
    return { ok: false, message: 'task line not updated' }
  }

  return { ok: true, files: next }
}
