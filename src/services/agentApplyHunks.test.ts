import { describe, expect, it } from 'vitest'
import { initHunkSelections, resolveApplyContent } from './agentApplyHunks'
import type { AgentApplyItem } from '../store/ideStore'

describe('agentApplyHunks', () => {
  const modified: AgentApplyItem = {
    path: 'a.ts',
    oldContent: 'old\nline',
    newContent: 'new\nline',
    language: 'typescript',
  }

  it('defaults to all hunks accepted', () => {
    const selections = initHunkSelections([modified])
    expect(resolveApplyContent(modified, selections)).toBe(modified.newContent)
  })

  it('keeps original when no hunks accepted', () => {
    const selections = initHunkSelections([modified])
    selections.set(modified.path, new Set())
    expect(resolveApplyContent(modified, selections)).toBe(modified.oldContent)
  })

  it('passes through new files', () => {
    const created: AgentApplyItem = {
      path: 'b.ts',
      oldContent: '',
      newContent: 'created',
      language: 'typescript',
    }
    expect(resolveApplyContent(created, new Map())).toBe('created')
  })
})
