import { describe, expect, it, vi } from 'vitest'
import { getDefaultShortcuts } from './useKeyboardShortcuts'

describe('getDefaultShortcuts', () => {
  it('maps Ctrl+Shift+G to toggle Git panel', () => {
    const onToggleGitPanel = vi.fn()
    const shortcuts = getDefaultShortcuts({ onToggleGitPanel })
    shortcuts['ctrl+shift+g']()
    expect(onToggleGitPanel).toHaveBeenCalledOnce()
  })
})
