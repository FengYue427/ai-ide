import { describe, expect, it, vi } from 'vitest'
import { getDefaultShortcuts } from './useKeyboardShortcuts'

describe('getDefaultShortcuts', () => {
  it('maps Ctrl+Shift+G to toggle Git panel', () => {
    const onToggleGitPanel = vi.fn()
    const shortcuts = getDefaultShortcuts({ onToggleGitPanel })
    shortcuts['ctrl+shift+g']()
    expect(onToggleGitPanel).toHaveBeenCalledOnce()
  })

  it('maps debug execution shortcuts', () => {
    const onDebugContinue = vi.fn()
    const onDebugStop = vi.fn()
    const shortcuts = getDefaultShortcuts({ onDebugContinue, onDebugStop })
    shortcuts.f5()
    shortcuts['shift+f5']()
    expect(onDebugContinue).toHaveBeenCalledOnce()
    expect(onDebugStop).toHaveBeenCalledOnce()
  })
})
