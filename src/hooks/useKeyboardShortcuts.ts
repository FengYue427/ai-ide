import { useEffect, useCallback } from 'react'

interface ShortcutMap {
  [key: string]: () => void
}

export const useKeyboardShortcuts = (shortcuts: ShortcutMap, enabled: boolean = true) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // 忽略输入框中的快捷键
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // 允许在输入框中使用 Escape
      if (e.key !== 'Escape') return
    }

    const key = []
    if (e.ctrlKey || e.metaKey) key.push('ctrl')
    if (e.altKey) key.push('alt')
    if (e.shiftKey) key.push('shift')
    key.push(e.key.toLowerCase())

    const shortcutKey = key.join('+')
    const handler = shortcuts[shortcutKey]

    if (handler) {
      e.preventDefault()
      handler()
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// 预定义的快捷键配置
export const getDefaultShortcuts = (actions: {
  onSave?: () => void
  onNewFile?: () => void
  onOpenFile?: () => void
  onRun?: () => void
  onSearch?: () => void
  onCommandPalette?: () => void
  onToggleTerminal?: () => void
  onToggleSidebar?: () => void
  onFormat?: () => void
  onClosePanel?: () => void
}) => ({
  'ctrl+s': actions.onSave || (() => {}),
  'ctrl+n': actions.onNewFile || (() => {}),
  'ctrl+o': actions.onOpenFile || (() => {}),
  'ctrl+enter': actions.onRun || (() => {}),
  'ctrl+shift+f': actions.onSearch || (() => {}),
  'ctrl+shift+p': actions.onCommandPalette || (() => {}),
  'ctrl+`': actions.onToggleTerminal || (() => {}),
  'ctrl+b': actions.onToggleSidebar || (() => {}),
  'ctrl+shift+i': actions.onFormat || (() => {}),
  'escape': actions.onClosePanel || (() => {}),
})
