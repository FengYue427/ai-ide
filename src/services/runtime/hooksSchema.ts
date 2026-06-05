/** v1.4.5 — hooks.yaml parse/validate (subset). See docs/ADR_V1.5_AIDE_RUNTIME.md */

export const HOOK_ON_EVENTS = ['queue.before', 'queue.after', 'apply.after', 'verify.fail'] as const
export const HOOK_RUN_KINDS = ['shell', 'agent', 'enqueue'] as const

export type HookOnEvent = (typeof HOOK_ON_EVENTS)[number]
export type HookRunKind = (typeof HOOK_RUN_KINDS)[number]

export interface RuntimeHookDef {
  id: string
  on: HookOnEvent
  run: HookRunKind
  command?: string
  cwd?: string
  prompt?: string
  spec?: string
  task?: string
}

export interface HooksDocument {
  version: 1
  hooks: RuntimeHookDef[]
}

export interface HooksParseResult {
  ok: boolean
  document?: HooksDocument
  errors: string[]
}

const HOOKS_FILE_RE = /hooks\.ya?ml$/i

export function isHooksYamlPath(path: string): boolean {
  return HOOKS_FILE_RE.test(path)
}

export function hooksPathFromTasksPath(tasksPath: string): string {
  return tasksPath.replace(/[\\/]tasks\.md$/i, '/hooks.yaml')
}

function parseScalarValue(raw: string): string {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/** Minimal YAML walker for hooks.yaml v1 (no external deps). */
export function parseHooksYaml(content: string): HooksParseResult {
  const errors: string[] = []
  const trimmed = content.trim()
  if (!trimmed) {
    return { ok: false, errors: ['hooks.yaml is empty'] }
  }

  let version: number | null = null
  const hooks: Array<Partial<RuntimeHookDef>> = []
  let current: Partial<RuntimeHookDef> | null = null

  for (const line of trimmed.split(/\r?\n/)) {
    const withoutComment = line.split('#')[0] ?? ''
    const text = withoutComment.trim()
    if (!text) continue

    if (text.startsWith('version:')) {
      const raw = text.slice('version:'.length).trim()
      const n = Number.parseInt(raw, 10)
      if (!Number.isFinite(n)) errors.push(`invalid version: ${raw}`)
      else version = n
      continue
    }

    if (text === 'hooks:') continue

    if (text.startsWith('- ')) {
      if (current) hooks.push(current)
      current = {}
      const rest = text.slice(2).trim()
      const colon = rest.indexOf(':')
      if (colon > 0) {
        const key = rest.slice(0, colon).trim()
        const value = parseScalarValue(rest.slice(colon + 1))
        assignHookField(current, key, value, errors)
      }
      continue
    }

    if (current) {
      const colon = text.indexOf(':')
      if (colon > 0) {
        const key = text.slice(0, colon).trim()
        const value = parseScalarValue(text.slice(colon + 1))
        assignHookField(current, key, value, errors)
      }
    }
  }

  if (current) hooks.push(current)

  if (version == null) errors.push('missing version')
  else if (version !== 1) errors.push(`unsupported version: ${version}`)

  const validated: RuntimeHookDef[] = []
  hooks.forEach((hook, index) => {
    const prefix = `hooks[${index}]`
    if (!hook.id?.trim()) {
      errors.push(`${prefix}: missing id`)
      return
    }
    if (!hook.on || !HOOK_ON_EVENTS.includes(hook.on as HookOnEvent)) {
      errors.push(`${prefix} "${hook.id}": invalid on`)
      return
    }
    if (!hook.run || !HOOK_RUN_KINDS.includes(hook.run as HookRunKind)) {
      errors.push(`${prefix} "${hook.id}": invalid run`)
      return
    }
    if (hook.run === 'shell' && !hook.command?.trim()) {
      errors.push(`${prefix} "${hook.id}": shell requires command`)
      return
    }
    if (hook.run === 'agent' && !hook.prompt?.trim()) {
      errors.push(`${prefix} "${hook.id}": agent requires prompt`)
      return
    }
    if (hook.run === 'enqueue' && (!hook.spec?.trim() || !hook.task?.trim())) {
      errors.push(`${prefix} "${hook.id}": enqueue requires spec and task`)
      return
    }
    validated.push({
      id: hook.id.trim(),
      on: hook.on as HookOnEvent,
      run: hook.run as HookRunKind,
      command: hook.command?.trim(),
      cwd: hook.cwd?.trim(),
      prompt: hook.prompt?.trim(),
      spec: hook.spec?.trim(),
      task: hook.task?.trim(),
    })
  })

  const ids = validated.map((h) => h.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length > 0) errors.push(`duplicate hook id: ${[...new Set(dupes)].join(', ')}`)

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    document: { version: 1, hooks: validated },
    errors: [],
  }
}

function assignHookField(
  hook: Partial<RuntimeHookDef>,
  key: string,
  value: string,
  errors: string[],
): void {
  switch (key) {
    case 'id':
      hook.id = value
      break
    case 'on':
      hook.on = value as HookOnEvent
      break
    case 'run':
      hook.run = value as HookRunKind
      break
    case 'command':
      hook.command = value
      break
    case 'cwd':
      hook.cwd = value
      break
    case 'prompt':
      hook.prompt = value
      break
    case 'spec':
      hook.spec = value
      break
    case 'task':
      hook.task = value
      break
    default:
      errors.push(`unknown field: ${key}`)
  }
}

export function formatHooksPreviewLines(document: HooksDocument): string[] {
  return document.hooks.map((hook) => `${hook.id} · ${hook.on} · ${hook.run}`)
}
