import { describe, expect, it } from 'vitest'
import {
  buildQueueRestorePreview,
  formatQueueRestorePreview,
  hasQueueRestoreItems,
} from './queueReportRestorePreviewService'

describe('queueReportRestorePreviewService', () => {
  it('builds preview from report markdown', () => {
    const md = `# Report

## Restore Hints

- plan | .aide/plans/p.md | 1 | Do thing
`
    const files = [
      {
        name: '.aide/plans/p.md',
        content: '# P\n\n- [ ] Do thing\n',
      },
    ]
    const preview = buildQueueRestorePreview(md, files)
    expect(hasQueueRestoreItems(preview)).toBe(true)
    expect(preview.planItems[0].stepText).toBe('Do thing')
    expect(formatQueueRestorePreview(preview)).toContain('Plan 步骤')
  })
})
