import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_TAB_DEBOUNCE_MS,
  DEFAULT_TAB_MAX_LINES,
  MAX_TAB_DEBOUNCE_MS,
  MAX_TAB_MAX_LINES,
  MIN_TAB_DEBOUNCE_MS,
  MIN_TAB_MAX_LINES,
  getTabCompletionDebounceMs,
  getTabCompletionMaxLines,
  setTabCompletionDebounceMs,
  setTabCompletionMaxLines,
} from './inlineCompletionPrefs'

const storage = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
})

describe('inlineCompletionPrefs', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('clamps max lines to configured bounds', () => {
    setTabCompletionMaxLines(0)
    expect(getTabCompletionMaxLines()).toBe(MIN_TAB_MAX_LINES)
    setTabCompletionMaxLines(99)
    expect(getTabCompletionMaxLines()).toBe(MAX_TAB_MAX_LINES)
    setTabCompletionMaxLines(7)
    expect(getTabCompletionMaxLines()).toBe(7)
  })

  it('clamps debounce ms to configured bounds', () => {
    setTabCompletionDebounceMs(50)
    expect(getTabCompletionDebounceMs()).toBe(MIN_TAB_DEBOUNCE_MS)
    setTabCompletionDebounceMs(999)
    expect(getTabCompletionDebounceMs()).toBe(MAX_TAB_DEBOUNCE_MS)
    setTabCompletionDebounceMs(420)
    expect(getTabCompletionDebounceMs()).toBe(420)
  })

  it('falls back to defaults for invalid stored values', () => {
    localStorage.setItem('ai-ide:tab-completion-max-lines', 'not-a-number')
    localStorage.setItem('ai-ide:tab-completion-debounce-ms', 'NaN')
    expect(getTabCompletionMaxLines()).toBe(DEFAULT_TAB_MAX_LINES)
    expect(getTabCompletionDebounceMs()).toBe(DEFAULT_TAB_DEBOUNCE_MS)
  })
})
