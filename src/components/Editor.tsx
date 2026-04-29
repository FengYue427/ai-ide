import React, { useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { SkeletonLoader } from './SkeletonLoader'

interface EditorProps {
  value: string
  language: string
  theme?: 'vs-dark' | 'light'
  onChange: (value: string | undefined) => void
}

const Editor: React.FC<EditorProps> = ({ value, language, theme = 'vs-dark', onChange }) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <SkeletonLoader theme={theme === 'vs-dark' ? 'dark' : 'light'} />
        </div>
      )}
      
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        loading={null}
        onMount={() => setIsLoading(false)}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          folding: true,
          renderLineHighlight: 'line',
          matchBrackets: 'always',
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on'
        }}
      />
    </div>
  )
}

export default Editor
