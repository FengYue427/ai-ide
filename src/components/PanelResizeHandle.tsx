/**
 * Horizontal resize handle for sidebars and right panels (v1.2.2 F4).
 * Renders a narrow interactive strip between panels.
 */
import type { FC } from 'react'
import type { ResizeEdge } from '../hooks/usePanelResize'

interface PanelResizeHandleProps {
  edge: ResizeEdge
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void
  onDoubleClick: () => void
  ariaLabel: string
}

export const PanelResizeHandle: FC<PanelResizeHandleProps> = ({
  edge,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
  ariaLabel,
}) => {
  return (
    <div
      className={`panel-resize-handle panel-resize-handle--${edge}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      tabIndex={0}
    />
  )
}
