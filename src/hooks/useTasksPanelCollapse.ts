import { useCallback, useEffect, useRef, useState } from 'react'
import type { TaskFileGroup } from '../lib/projectTasksNavigation'
import { pathsForAutoCollapsedGroups } from '../lib/tasksPanelPrefs'
import { loadTasksPanelCollapsePrefs, saveTasksPanelCollapsePrefs } from '../services/tasksPanelPrefsService'

export function useTasksPanelCollapse(groups: TaskFileGroup[]) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set())
  const hydratedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initialMergeRef = useRef(false)

  useEffect(() => {
    if (groups.length === 0 || initialMergeRef.current) return
    initialMergeRef.current = true

    let cancelled = false
    void loadTasksPanelCollapsePrefs().then((prefs) => {
      if (cancelled) return
      const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0)
      const autoPaths = pathsForAutoCollapsedGroups(groups, totalItems)
      const merged = new Set([...prefs.collapsedPaths, ...autoPaths])
      setCollapsed(merged)
      hydratedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [groups])

  useEffect(() => {
    if (!hydratedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveTasksPanelCollapsePrefs([...collapsed])
    }, 400)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [collapsed])

  const isCollapsed = useCallback((path: string) => collapsed.has(path), [collapsed])

  const toggleCollapsed = useCallback((path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const expandForSearch = useCallback((paths: string[]) => {
    if (paths.length === 0) return
    setCollapsed((prev) => {
      const next = new Set(prev)
      for (const path of paths) next.delete(path)
      return next
    })
  }, [])

  const isItemsExpanded = useCallback((path: string) => expandedItems.has(path), [expandedItems])

  const toggleItemsExpanded = useCallback((path: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  return {
    isCollapsed,
    toggleCollapsed,
    expandForSearch,
    isItemsExpanded,
    toggleItemsExpanded,
  }
}
