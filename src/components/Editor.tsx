import React from 'react'
import MonacoEditor from '@monaco-editor/react'

interface EditorProps {
  value: string
  language: string
  theme?: 'vs-dark' | 'light'
  onChange: (value: string | undefined) => void
}

const Editor: React.FC<EditorProps> = ({ value, language, theme = 'vs-dark', onChange }) => {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme={theme}
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
  )
}

export default Editor
