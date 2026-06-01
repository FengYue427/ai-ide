import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'
import 'monaco-editor/esm/vs/language/css/monaco.contribution'
import 'monaco-editor/esm/vs/language/html/monaco.contribution'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

let configured = false
let themesRegistered = false

function registerMonacoThemes() {
  if (themesRegistered) return
  monaco.editor.defineTheme('ai-ide-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0b1020',
      'editorGutter.background': '#0b1020',
      'editor.lineHighlightBackground': '#121a2b',
      'editorWidget.background': '#121a2b',
      'editor.selectionBackground': '#33426188',
      'minimap.background': '#0b1020',
    },
  })
  monaco.editor.defineTheme('ai-ide-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f5f7fb',
      'editorGutter.background': '#f5f7fb',
      'editor.lineHighlightBackground': '#eef2f9',
      'editorWidget.background': '#ffffff',
      'minimap.background': '#f5f7fb',
    },
  })
  themesRegistered = true
}

export type AppEditorTheme = 'vs-dark' | 'light'

export function resolveMonacoTheme(appTheme: AppEditorTheme): string {
  registerMonacoThemes()
  return appTheme === 'light' ? 'ai-ide-light' : 'ai-ide-dark'
}

export function configureMonaco() {
  if (configured) return
  registerMonacoThemes()

  ;(globalThis as typeof globalThis & {
    MonacoEnvironment?: {
      getWorker: (_moduleId: string, label: string) => Worker
    }
  }).MonacoEnvironment = {
    getWorker: (_moduleId, label) => {
      if (label === 'json') return new jsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
      if (label === 'typescript' || label === 'javascript') return new tsWorker()
      return new editorWorker()
    },
  }

  loader.config({ monaco })
  configured = true
}

export type MonacoEditorInstance = monaco.editor.IStandaloneCodeEditor
export type MonacoMarker = monaco.editor.IMarker
