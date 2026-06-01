import React, { useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { configureMonaco, resolveMonacoTheme, type AppEditorTheme } from '../editor/monacoSetup'
import { SkeletonLoader } from './SkeletonLoader'
import type { GitDiffRenderLayout } from '../lib/gitDiffLayout'

interface GitDiffEditorProps {
  original: string
  modified: string
  language: string
  theme?: AppEditorTheme
  layout?: GitDiffRenderLayout
}

configureMonaco()

export const GitDiffEditor: React.FC<GitDiffEditorProps> = ({
  original,
  modified,
  language,
  theme = 'vs-dark',
  layout = 'sideBySide',
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const renderSideBySide = layout === 'sideBySide'

  return (
    <div className="git-diff-editor" style={{ height: '100%', width: '100%', position: 'relative' }}>
      {isLoading ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SkeletonLoader />
        </div>
      ) : null}
      <DiffEditor
        height="100%"
        language={language}
        original={original}
        modified={modified}
        theme={resolveMonacoTheme(theme)}
        onMount={() => setIsLoading(false)}
        options={{
          readOnly: true,
          renderSideBySide,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
