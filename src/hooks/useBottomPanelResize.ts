import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { BOTTOM_PANEL_DEFAULT_HEIGHT, clampBottomPanelHeight } from '../lib/bottomPanelPrefs'

export function useBottomPanelResize(height: number, onHeightChange: (next: number) => void) {
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragRef.current = { startY: event.clientY, startHeight: height }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [height],
  )

  const onResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - event.clientY
      onHeightChange(clampBottomPanelHeight(dragRef.current.startHeight + delta))
    },
    [onHeightChange],
  )

  const onResizePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const onResizeDoubleClick = useCallback(() => {
    onHeightChange(clampBottomPanelHeight(BOTTOM_PANEL_DEFAULT_HEIGHT))
  }, [onHeightChange])

  return {
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeDoubleClick,
  }
}
