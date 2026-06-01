import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

const DEFAULT_ROW_HEIGHT = 32
const OVERSCAN = 6

interface VirtualFileTreeListProps {
  rowCount: number
  rowHeight?: number
  className?: string
  renderRow: (index: number) => ReactNode
}

/** Lightweight windowed list for large file trees (v1.2 F2). */
export function VirtualFileTreeList({
  rowCount,
  rowHeight = DEFAULT_ROW_HEIGHT,
  className,
  renderRow,
}: VirtualFileTreeListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ scrollTop: 0, height: 320 })

  const updateViewport = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setViewport({ scrollTop: el.scrollTop, height: el.clientHeight })
  }, [])

  useEffect(() => {
    updateViewport()
    const el = containerRef.current
    if (!el) return

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateViewport) : null
    observer?.observe(el)
    el.addEventListener('scroll', updateViewport, { passive: true })

    return () => {
      observer?.disconnect()
      el.removeEventListener('scroll', updateViewport)
    }
  }, [updateViewport, rowCount])

  const totalHeight = rowCount * rowHeight
  const start = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - OVERSCAN)
  const visibleCount = Math.ceil(viewport.height / rowHeight) + OVERSCAN * 2
  const end = Math.min(rowCount, start + visibleCount)

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="virtual-file-tree"
      style={{ overflow: 'auto', flex: 1, minHeight: 0 }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {Array.from({ length: end - start }, (_, offset) => {
          const index = start + offset
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: index * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
              }}
            >
              {renderRow(index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
