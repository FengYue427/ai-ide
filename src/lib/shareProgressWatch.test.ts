import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildShareProgressDigest } from './shareProgressDigest'
import type { ShareProgressViewModel } from './shareProgressView'
import type { WeeklyRecap } from './weeklyRecapService'
import {
  hasShareProgressUpdate,
  markShareProgressSeen,
  subscribeShareProgressWatch,
  signalShareProgressLocalDigest,
} from './shareProgressWatch'

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

describe('shareProgressWatch updates', () => {
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

  it('detects digest changes for watched shares', () => {
    const digest = buildShareProgressDigest(view)
    subscribeShareProgressWatch('abc', 'Demo', digest)
    expect(hasShareProgressUpdate('abc', digest)).toBe(false)

    const changed = buildShareProgressDigest({
      ...view,
      weeklyRecap: { ...recap, doneTaskCount: 3 },
    })
    expect(hasShareProgressUpdate('abc', changed)).toBe(true)

    markShareProgressSeen('abc', changed)
    expect(hasShareProgressUpdate('abc', changed)).toBe(false)
  })

  it('detects local workspace digest drift', () => {
    const digest = buildShareProgressDigest(view)
    subscribeShareProgressWatch('abc', 'Demo', digest)
    signalShareProgressLocalDigest('abc', buildShareProgressDigest({ ...view, weeklyRecap: { ...recap, doneTaskCount: 5 } }))
    expect(hasShareProgressUpdate('abc', digest)).toBe(true)
  })
})
