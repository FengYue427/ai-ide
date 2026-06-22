/**
 * Panel width state management with persistence (v1.2.2 F4).
 * Combines localStorage persistence with CSS variable application.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AUXILIARY_DEFAULT_WIDTH,
  clampAuxiliaryWidth,
  clampIntentShellLeftWidth,
  clampIntentShellQueueWidth,
  clampRightPanelWidth,
  clampSidebarWidth,
  INTENT_SHELL_LEFT_DEFAULT_WIDTH,
  INTENT_SHELL_QUEUE_DEFAULT_WIDTH,
  loadPanelWidthPrefs,
  savePanelWidthPrefs,
  applySidebarWidthCssVar,
  applyRightPanelWidthCssVars,
  applyAuxiliaryWidthCssVar,
  applyIntentShellWidthCssVars,
  SIDEBAR_DEFAULT_WIDTH,
  RIGHT_PANEL_DEFAULT_WIDTH,
} from '../lib/panelWidthPrefs'

export function usePanelWidth() {
  const [sidebarWidth, setSidebarWidthRaw] = useState<number>(SIDEBAR_DEFAULT_WIDTH)
  const [rightPanelWidth, setRightPanelWidthRaw] = useState<number>(RIGHT_PANEL_DEFAULT_WIDTH)
  const [auxiliaryWidth, setAuxiliaryWidthRaw] = useState<number>(AUXILIARY_DEFAULT_WIDTH)
  const [intentShellLeftWidth, setIntentShellLeftWidthRaw] = useState<number>(
    INTENT_SHELL_LEFT_DEFAULT_WIDTH,
  )
  const [intentShellQueueWidth, setIntentShellQueueWidthRaw] = useState<number>(
    INTENT_SHELL_QUEUE_DEFAULT_WIDTH,
  )
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const prefs = loadPanelWidthPrefs()
    setSidebarWidthRaw(prefs.sidebar)
    setRightPanelWidthRaw(prefs.rightPanel)
    setAuxiliaryWidthRaw(prefs.auxiliary)
    setIntentShellLeftWidthRaw(prefs.intentShellLeft)
    setIntentShellQueueWidthRaw(prefs.intentShellQueue)
    applySidebarWidthCssVar(prefs.sidebar)
    applyRightPanelWidthCssVars(prefs.rightPanel)
    applyAuxiliaryWidthCssVar(prefs.auxiliary)
    applyIntentShellWidthCssVars(prefs.intentShellLeft, prefs.intentShellQueue)
  }, [])

  const persist = useCallback((patch: Partial<ReturnType<typeof loadPanelWidthPrefs>>) => {
    const current = loadPanelWidthPrefs()
    savePanelWidthPrefs({ ...current, ...patch })
  }, [])

  const setSidebarWidth = useCallback(
    (next: number) => {
      const clamped = clampSidebarWidth(next)
      setSidebarWidthRaw(clamped)
      applySidebarWidthCssVar(clamped)
      persist({ sidebar: clamped })
    },
    [persist],
  )

  const setRightPanelWidth = useCallback(
    (next: number) => {
      const clamped = clampRightPanelWidth(next)
      setRightPanelWidthRaw(clamped)
      applyRightPanelWidthCssVars(clamped)
      persist({ rightPanel: clamped })
    },
    [persist],
  )

  const setAuxiliaryWidth = useCallback(
    (next: number) => {
      const clamped = clampAuxiliaryWidth(next)
      setAuxiliaryWidthRaw(clamped)
      applyAuxiliaryWidthCssVar(clamped)
      persist({ auxiliary: clamped })
    },
    [persist],
  )

  const setIntentShellLeftWidth = useCallback(
    (next: number) => {
      const clamped = clampIntentShellLeftWidth(next)
      setIntentShellLeftWidthRaw(clamped)
      applyIntentShellWidthCssVars(clamped, loadPanelWidthPrefs().intentShellQueue)
      persist({ intentShellLeft: clamped })
    },
    [persist],
  )

  const setIntentShellQueueWidth = useCallback(
    (next: number) => {
      const clamped = clampIntentShellQueueWidth(next)
      setIntentShellQueueWidthRaw(clamped)
      applyIntentShellWidthCssVars(loadPanelWidthPrefs().intentShellLeft, clamped)
      persist({ intentShellQueue: clamped })
    },
    [persist],
  )

  const resetSidebarWidth = useCallback(() => {
    setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)
  }, [setSidebarWidth])

  const resetRightPanelWidth = useCallback(() => {
    setRightPanelWidth(RIGHT_PANEL_DEFAULT_WIDTH)
  }, [setRightPanelWidth])

  const resetAuxiliaryWidth = useCallback(() => {
    setAuxiliaryWidth(AUXILIARY_DEFAULT_WIDTH)
  }, [setAuxiliaryWidth])

  const resetIntentShellLeftWidth = useCallback(() => {
    setIntentShellLeftWidth(INTENT_SHELL_LEFT_DEFAULT_WIDTH)
  }, [setIntentShellLeftWidth])

  const resetIntentShellQueueWidth = useCallback(() => {
    setIntentShellQueueWidth(INTENT_SHELL_QUEUE_DEFAULT_WIDTH)
  }, [setIntentShellQueueWidth])

  return {
    sidebarWidth,
    rightPanelWidth,
    auxiliaryWidth,
    intentShellLeftWidth,
    intentShellQueueWidth,
    setSidebarWidth,
    setRightPanelWidth,
    setAuxiliaryWidth,
    setIntentShellLeftWidth,
    setIntentShellQueueWidth,
    resetSidebarWidth,
    resetRightPanelWidth,
    resetAuxiliaryWidth,
    resetIntentShellLeftWidth,
    resetIntentShellQueueWidth,
  }
}
