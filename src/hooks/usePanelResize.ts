/**
 * Horizontal panel resize hook (v1.2.2 F4).
 * Reuses the same pointer-event pattern as useBottomPanelResize.
 * @see docs/V1.2.2_F4_PANEL_RESIZE.md
 */
import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'

export type ResizeEdge = 'left' | 'right'

export function usePanelResize(
  width: number,
  onWidthChange: (next: number) => void,
  edge: ResizeEdge,
) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragRef.current = { startX: event.clientX, startWidth: width }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [width],
  )

  const onResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      const delta = edge === 'right'
        ? event.clientX - dragRef.current.startX  // Right edge: drag right = wider
        : dragRef.current.startX - event.clientX   // Left edge: drag left = wider
      onWidthChange(dragRef.current.startWidth + delta)
    },
    [edge, onWidthChange],
  )

  const onResizePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const onResizeDoubleClick = useCallback(() => {
    onWidthChange(dragRef.current?.startWidth ?? width)
  }, [width, onWidthChange])

  return {
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp,
    onResizeDoubleClick,
  }
}
