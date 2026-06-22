import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLearningPathStatus,
  isLearningPathSpecComplete,
  markLearningPathCompleted,
  markLearningPathStarted,
  syncLearningPathCompletion,
  LEARNING_PATH_PROGRESS_KEY,
} from './learningPathProgress'
import { LEARNING_PATHS } from './learningPaths'

function stubLocalStorage() {
  vi.stubGlobal('localStorage', {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return (this as { store: Record<string, string> }).store[key] ?? null
    },
    setItem(key: string, value: string) {
      ;(this as { store: Record<string, string> }).store[key] = value
    },
    removeItem(key: string) {
      delete (this as { store: Record<string, string> }).store[key]
    },
    clear() {
      ;(this as { store: Record<string, string> }).store = {}
    },
  })
  vi.stubGlobal('window', {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
}

describe('learningPathProgress', () => {
  beforeEach(() => {
    stubLocalStorage()
    localStorage.removeItem(LEARNING_PATH_PROGRESS_KEY)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('tracks started and completed status', () => {
    markLearningPathStarted('intent-demo')
    expect(getLearningPathStatus('intent-demo')).toBe('in_progress')
    markLearningPathCompleted('intent-demo')
    expect(getLearningPathStatus('intent-demo')).toBe('completed')
  })

  it('auto-completes when all spec tasks are done', () => {
    const path = LEARNING_PATHS[0]
    markLearningPathStarted(path.id)
    syncLearningPathCompletion([
      {
        name: `.aide/specs/${path.specName}/tasks.md`,
        content: '- [x] Task one\n- [x] Task two\n',
        language: 'markdown',
      },
    ])
    expect(getLearningPathStatus(path.id)).toBe('completed')
  })

  it('detects incomplete spec tasks', () => {
    const path = LEARNING_PATHS[0]
    expect(
      isLearningPathSpecComplete(
        [
          {
            name: `.aide/specs/${path.specName}/tasks.md`,
            content: '- [x] Done\n- [ ] Open\n',
            language: 'markdown',
          },
        ],
        path,
      ),
    ).toBe(false)
  })
})
