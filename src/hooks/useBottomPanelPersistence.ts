import { useEffect, useRef } from 'react'
import { persistBottomPanelHeight, persistBottomPanelTab } from '../services/bottomPanelPrefsService'
import { useIDEStore } from '../store/ideStore'

/** Debounced localStorage sync for bottom panel tab + height (v1.1.5 F4). */
export function useBottomPanelPersistence() {
  const tab = useIDEStore((s) => s.bottomPanelTab)
  const height = useIDEStore((s) => s.bottomPanelHeight)
  const heightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void persistBottomPanelTab(tab)
  }, [tab])

  useEffect(() => {
    if (heightTimerRef.current) clearTimeout(heightTimerRef.current)
    heightTimerRef.current = setTimeout(() => {
      void persistBottomPanelHeight(height)
    }, 200)
    return () => {
      if (heightTimerRef.current) clearTimeout(heightTimerRef.current)
    }
  }, [height])
}
