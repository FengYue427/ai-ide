import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  buildRemoteCollabDecorations,
  listRemotePresences,
  type CollabEditorSelection,
} from '../lib/collabAwareness'
import type { MonacoEditorInstance } from '../editor/monacoSetup'
import { collaborationService } from '../services/collaborationService'

/** Broadcast local cursor/selection and render remote peers in Monaco (v1.1.3.3). */
export function useCollabEditorPresence(
  editor: MonacoEditorInstance | null,
  filePath: string | undefined,
  enabled: boolean,
): void {
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)

  useEffect(() => {
    if (!enabled || !editor || !filePath) {
      decorationsRef.current?.clear()
      decorationsRef.current = null
      return
    }

    const room = collaborationService.getCurrentRoom()
    if (!room) return

    decorationsRef.current = editor.createDecorationsCollection()

    const refreshRemoteDecorations = () => {
      const collection = decorationsRef.current
      if (!collection) return
      const remote = listRemotePresences(
        room.awareness.getStates() as Map<number, Record<string, unknown>>,
        room.awareness.clientID,
        filePath,
      )
      collection.set(buildRemoteCollabDecorations(monaco, remote))
    }

    const publishPresence = (selection: CollabEditorSelection) => {
      collaborationService.updateEditorPresence(filePath, selection)
    }

    refreshRemoteDecorations()

    const initialSelection = editor.getSelection()
    if (initialSelection) {
      publishPresence({
        startLine: initialSelection.startLineNumber,
        startColumn: initialSelection.startColumn,
        endLine: initialSelection.endLineNumber,
        endColumn: initialSelection.endColumn,
      })
    }

    const cursorDisposable = editor.onDidChangeCursorSelection((event) => {
      const sel = event.selection
      publishPresence({
        startLine: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLine: sel.endLineNumber,
        endColumn: sel.endColumn,
      })
    })

    room.awareness.on('change', refreshRemoteDecorations)

    return () => {
      cursorDisposable.dispose()
      room.awareness.off('change', refreshRemoteDecorations)
      decorationsRef.current?.clear()
      decorationsRef.current = null
    }
  }, [editor, enabled, filePath])
}
