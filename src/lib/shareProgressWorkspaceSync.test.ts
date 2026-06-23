import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildShareProgressDigest } from './shareProgressDigest'
import type { ShareProgressViewModel } from './shareProgressView'
import type { WeeklyRecap } from './weeklyRecapService'
import { subscribeShareProgressWatch, hasShareProgressUpdate } from './shareProgressWatch'
import { linkWorkspaceShare } from './shareWorkspaceLink'
import { syncLinkedShareProgressFromFiles } from './shareProgressWorkspaceSync'

const recap: WeeklyRecap = {
  doneTaskCount: 1,
  openTaskCount: 2,
  specCount: 1,
  proofReportCount: 0,
  queueReportCount: 0,
  recentProofPaths: [],
  learningPathCompleted: [],
  learningPathInProgress: [],
}

const view: ShareProgressViewModel = {
  intentSnapshot: null,
  intentSummary: '',
  proofHtmlFiles: [],
  weeklyRecap: recap,
}

describe('shareProgressWorkspaceSync', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return store[key] ?? null
      },
      setItem(key: string, value: string) {
        store[key] = value
      },
      removeItem(key: string) {
        delete store[key]
      },
    })
  })

  it('flags watched linked share when workspace digest changes', () => {
    const digest = buildShareProgressDigest(view)
    linkWorkspaceShare('share-1', 'ws-a')
    subscribeShareProgressWatch('share-1', 'Demo', digest)

    const files = [{ name: '.aide/specs/x/tasks.md', content: '- [x] A\n- [ ] B\n', language: 'markdown' }]
    const result = syncLinkedShareProgressFromFiles(files, 'ws-a')
    expect(result?.shareId).toBe('share-1')

    const changed = buildShareProgressDigest({
      ...view,
      weeklyRecap: { ...recap, doneTaskCount: 2, openTaskCount: 1 },
    })
    expect(hasShareProgressUpdate('share-1', digest)).toBe(true)
    expect(changed).not.toBe(digest)
  })
})
