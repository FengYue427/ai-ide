import React, { useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { configureMonaco } from '../editor/monacoSetup'
import { SkeletonLoader } from './SkeletonLoader'

interface GitDiffEditorProps {
  original: string
  modified: string
  language: string
  theme?: 'vs-dark' | 'light'
}

configureMonaco()

export const GitDiffEditor: React.FC<GitDiffEditorProps> = ({
  original,
  modified,
  language,
  theme = 'vs-dark',
}) => {
  const [isLoading, setIsLoading] = useState(true)

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
        theme={theme}
        onMount={() => setIsLoading(false)}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
