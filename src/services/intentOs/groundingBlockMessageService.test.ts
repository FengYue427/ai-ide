import { describe, expect, it } from 'vitest'
import { formatGroundingBlockReason } from './groundingBlockMessageService'

const t = ((key: string, params?: Record<string, unknown>) => {
  if (key === 'intent.grounding.v2.detail') return `v2 symbols ${params?.count}`
  if (key === 'intent.grounding.missingPath') return `missing ${params?.path}`
  return key
}) as Parameters<typeof formatGroundingBlockReason>[1]

describe('formatGroundingBlockReason', () => {
  it('formats v2 symbol block', () => {
    const text = formatGroundingBlockReason(
      {
        reason: 'Grounding v2: missing symbols (2)',
        taskPath: '.aide/specs/demo/tasks.md',
      },
      t,
    )
    expect(text).toContain('v2 symbols 2')
  })
})
