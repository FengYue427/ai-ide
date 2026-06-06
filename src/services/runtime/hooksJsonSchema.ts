/** v1.5 F3 — hooks.yaml JSON Schema (draft-07 subset). */

import { HOOK_ON_EVENTS, HOOK_RUN_KINDS, type HooksDocument } from './hooksSchema'

export const HOOKS_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://ai-ide.dev/schemas/hooks.yaml.v1.json',
  title: 'AIDE Runtime hooks.yaml v1',
  type: 'object',
  additionalProperties: false,
  required: ['version', 'hooks'],
  properties: {
    version: { type: 'integer', const: 1 },
    hooks: {
      type: 'array',
      items: { $ref: '#/$defs/hook' },
    },
  },
  $defs: {
    hook: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'on', 'run'],
      properties: {
        id: { type: 'string', minLength: 1 },
        on: { type: 'string', enum: [...HOOK_ON_EVENTS] },
        run: { type: 'string', enum: [...HOOK_RUN_KINDS] },
        command: { type: 'string' },
        cwd: { type: 'string' },
        prompt: { type: 'string' },
        spec: { type: 'string' },
        task: { type: 'string' },
      },
    },
  },
} as const

export function validateHooksDocumentJsonSchema(document: HooksDocument): string[] {
  const errors: string[] = []

  if (document.version !== 1) {
    errors.push('schema: version must be 1')
  }

  const ids = new Set<string>()
  document.hooks.forEach((hook, index) => {
    const prefix = `schema.hooks[${index}]`
    if (!hook.id?.trim()) errors.push(`${prefix}: id required`)
    if (ids.has(hook.id)) errors.push(`${prefix}: duplicate id ${hook.id}`)
    ids.add(hook.id)

    if (!HOOK_ON_EVENTS.includes(hook.on)) errors.push(`${prefix}: invalid on`)
    if (!HOOK_RUN_KINDS.includes(hook.run)) errors.push(`${prefix}: invalid run`)

    if (hook.run === 'shell' && !hook.command?.trim()) {
      errors.push(`${prefix}: shell requires command`)
    }
    if (hook.run === 'agent' && !hook.prompt?.trim()) {
      errors.push(`${prefix}: agent requires prompt`)
    }
    if (hook.run === 'enqueue' && (!hook.spec?.trim() || !hook.task?.trim())) {
      errors.push(`${prefix}: enqueue requires spec and task`)
    }
  })

  return errors
}
