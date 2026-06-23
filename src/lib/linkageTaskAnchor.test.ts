import { describe, expect, it } from 'vitest'
import { buildIntentGraph } from '../services/intentOs/intentGraphService'
import {
  isLinkageSyntheticTaskAnchor,
  linkageSyntheticTaskAnchorId,
  linkageTaskAnchorOverlayNode,
  resolveLinkageTaskAnchorId,
} from './linkageTaskAnchor'

describe('linkageTaskAnchor', () => {
  const focus = '.aide/specs/x/tasks.md'
  const files = [
    {
      name: focus,
      content: '- [ ] Implement\n- [x] Done item\n',
      language: 'markdown',
    },
  ]

  it('prefers first open spec task id from files', () => {
    const base = buildIntentGraph({ files, focusTasksPath: focus })
    const anchor = resolveLinkageTaskAnchorId(focus, base, files)
    expect(anchor).toBe(`task:${focus}:Implement`)
    expect(isLinkageSyntheticTaskAnchor(anchor, focus)).toBe(false)
  })

  it('falls back to synthetic root when spec file missing', () => {
    const base = buildIntentGraph({ files: [], focusTasksPath: focus })
    const anchor = resolveLinkageTaskAnchorId(focus, base)
    expect(anchor).toBe(linkageSyntheticTaskAnchorId(focus))
    expect(isLinkageSyntheticTaskAnchor(anchor, focus)).toBe(true)
  })

  it('mirrors base spec-task label in overlay node', () => {
    const base = buildIntentGraph({ files, focusTasksPath: focus })
    const anchor = resolveLinkageTaskAnchorId(focus, base, files)
    const overlay = linkageTaskAnchorOverlayNode(anchor, focus, base)
    expect(overlay.label).toBe('Implement')
    expect(overlay.status).toBe('open')
  })
})
