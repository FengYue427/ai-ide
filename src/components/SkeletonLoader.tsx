import React, { useMemo } from 'react'

interface SkeletonLoaderProps {
  theme?: 'dark' | 'light'
}

const codeLines = [
  { width: 42, indent: 0 },
  { width: 58, indent: 1 },
  { width: 34, indent: 2 },
  { width: 62, indent: 2 },
  { width: 46, indent: 1 },
  { width: 68, indent: 0 },
  { width: 52, indent: 1 },
  { width: 36, indent: 2 },
  { width: 64, indent: 2 },
  { width: 44, indent: 1 },
  { width: 56, indent: 0 },
  { width: 60, indent: 1 },
  { width: 38, indent: 2 },
  { width: 50, indent: 2 },
  { width: 66, indent: 1 },
  { width: 48, indent: 0 },
]

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark'
  const lines = useMemo(() => codeLines, [])

  return (
    <div className={`editor-skeleton ${isDark ? 'editor-skeleton-dark' : 'editor-skeleton-light'}`}>
      <div className="editor-skeleton-gutter">
        {lines.map((_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>

      <div className="editor-skeleton-lines">
        {lines.map((line, index) => (
          <div key={index} className="editor-skeleton-line" style={{ paddingLeft: `${line.indent * 22}px` }}>
            <div className="editor-skeleton-token short" />
            <div className="editor-skeleton-token" style={{ width: `${line.width}%` }} />
          </div>
        ))}
      </div>

      <div className="editor-loading-badge">
        <span className="editor-loading-spinner" />
        <span>正在加载 Monaco 编辑器</span>
      </div>
    </div>
  )
}

export default SkeletonLoader
