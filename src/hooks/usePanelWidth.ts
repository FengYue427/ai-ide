/**
 * Panel width state management with persistence (v1.2.2 F4).
 * Combines localStorage persistence with CSS variable application.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampRightPanelWidth,
  clampSidebarWidth,
  loadPanelWidthPrefs,
  savePanelWidthPrefs,
  applySidebarWidthCssVar,
  applyRightPanelWidthCssVars,
  SIDEBAR_DEFAULT_WIDTH,
  RIGHT_PANEL_DEFAULT_WIDTH,
} from '../lib/panelWidthPrefs'

export function usePanelWidth() {
  const [sidebarWidth, setSidebarWidthRaw] = useState<number>(SIDEBAR_DEFAULT_WIDTH)
  const [rightPanelWidth, setRightPanelWidthRaw] = useState<number>(RIGHT_PANEL_DEFAULT_WIDTH)
  const initializedRef = useRef(false)

  // Load persisted prefs on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const prefs = loadPanelWidthPrefs()
    setSidebarWidthRaw(prefs.sidebar)
    setRightPanelWidthRaw(prefs.rightPanel)
    applySidebarWidthCssVar(prefs.sidebar)
    applyRightPanelWidthCssVars(prefs.rightPanel)
  }, [])

  const setSidebarWidth = useCallback((next: number) => {
    const clamped = clampSidebarWidth(next)
    setSidebarWidthRaw(clamped)
    applySidebarWidthCssVar(clamped)
    savePanelWidthPrefs({
      sidebar: clamped,
      rightPanel: loadPanelWidthPrefs().rightPanel,
    })
  }, [])

  const setRightPanelWidth = useCallback((next: number) => {
    const clamped = clampRightPanelWidth(next)
    setRightPanelWidthRaw(clamped)
    applyRightPanelWidthCssVars(clamped)
    savePanelWidthPrefs({
      sidebar: loadPanelWidthPrefs().sidebar,
      rightPanel: clamped,
    })
  }, [])

  const resetSidebarWidth = useCallback(() => {
    setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)
  }, [setSidebarWidth])

  const resetRightPanelWidth = useCallback(() => {
    setRightPanelWidth(RIGHT_PANEL_DEFAULT_WIDTH)
  }, [setRightPanelWidth])

  return {
    sidebarWidth,
    rightPanelWidth,
    setSidebarWidth,
    setRightPanelWidth,
    resetSidebarWidth,
    resetRightPanelWidth,
  }
}
