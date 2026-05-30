import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

export type CollabCursorPos = {
  filePath: string
  line: number
  column: number
}

export type CollabSelectionRange = {
  filePath: string
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

export type CollabAwarenessUser = {
  name: string
  color: string
  cursor: CollabCursorPos | null
  selection: CollabSelectionRange | null
}

export type CollabRemotePresence = {
  clientId: number
  user: CollabAwarenessUser
}

export type CollabEditorSelection = {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

const injectedStyleKeys = new Set<string>()

export function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '')
  if (hex.length !== 6) return hexColor
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function ensureCollabDecorationStyle(className: string, cssText: string): void {
  if (typeof document === 'undefined' || injectedStyleKeys.has(className)) return
  const style = document.createElement('style')
  style.setAttribute('data-collab-awareness', className)
  style.textContent = `.${className} { ${cssText} }`
  document.head.appendChild(style)
  injectedStyleKeys.add(className)
}

export function isCollapsedSelection(selection: CollabEditorSelection): boolean {
  return (
    selection.startLine === selection.endLine &&
    selection.startColumn === selection.endColumn
  )
}

export function parseCollabAwarenessUser(raw: unknown): CollabAwarenessUser | null {
  if (!raw || typeof raw !== 'object') return null
  const user = raw as Record<string, unknown>
  const name = typeof user.name === 'string' ? user.name : 'User'
  const color = typeof user.color === 'string' ? user.color : '#58a6ff'
  const cursor = parseCursor(user.cursor)
  const selection = parseSelection(user.selection)
  return { name, color, cursor, selection }
}

function parseCursor(raw: unknown): CollabCursorPos | null {
  if (!raw || typeof raw !== 'object') return null
  const cursor = raw as Record<string, unknown>
  if (typeof cursor.filePath !== 'string') return null
  if (typeof cursor.line !== 'number' || typeof cursor.column !== 'number') return null
  return { filePath: cursor.filePath, line: cursor.line, column: cursor.column }
}

function parseSelection(raw: unknown): CollabSelectionRange | null {
  if (!raw || typeof raw !== 'object') return null
  const selection = raw as Record<string, unknown>
  if (typeof selection.filePath !== 'string') return null
  const nums = ['startLine', 'startColumn', 'endLine', 'endColumn'] as const
  for (const key of nums) {
    if (typeof selection[key] !== 'number') return null
  }
  return {
    filePath: selection.filePath,
    startLine: selection.startLine as number,
    startColumn: selection.startColumn as number,
    endLine: selection.endLine as number,
    endColumn: selection.endColumn as number,
  }
}

export function listRemotePresences(
  states: Map<number, Record<string, unknown>>,
  localClientId: number,
  filePath: string,
): CollabRemotePresence[] {
  const remote: CollabRemotePresence[] = []
  states.forEach((state, clientId) => {
    if (clientId === localClientId) return
    const user = parseCollabAwarenessUser(state.user)
    if (!user) return
    const onFile =
      user.selection?.filePath === filePath || user.cursor?.filePath === filePath
    if (!onFile) return
    remote.push({ clientId, user })
  })
  return remote
}

export function buildRemoteCollabDecorations(
  monacoApi: typeof monaco,
  remote: CollabRemotePresence[],
): monaco.editor.IModelDeltaDecoration[] {
  const decorations: monaco.editor.IModelDeltaDecoration[] = []

  for (const { clientId, user } of remote) {
    const selClass = `collab-remote-sel-${clientId}`
    const cursorClass = `collab-remote-cursor-${clientId}`
    ensureCollabDecorationStyle(selClass, `background-color: ${withAlpha(user.color, 0.28)};`)
    ensureCollabDecorationStyle(
      cursorClass,
      `border-left: 2px solid ${user.color}; margin-left: -1px;`,
    )

    const selection = user.selection?.filePath === user.cursor?.filePath ? user.selection : null
    if (selection && !selectionIsCollapsed(selection)) {
      decorations.push({
        range: new monacoApi.Range(
          selection.startLine,
          selection.startColumn,
          selection.endLine,
          selection.endColumn,
        ),
        options: {
          inlineClassName: selClass,
          stickiness: monacoApi.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          hoverMessage: { value: user.name },
        },
      })
    }

    const cursor = user.cursor
    if (!cursor) continue

    decorations.push({
      range: new monacoApi.Range(cursor.line, cursor.column, cursor.line, cursor.column),
      options: {
        before: {
          content: '\u200b',
          inlineClassName: cursorClass,
        },
        showIfCollapsed: true,
        stickiness: monacoApi.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        hoverMessage: { value: user.name },
      },
    })
  }

  return decorations
}

function selectionIsCollapsed(selection: CollabSelectionRange): boolean {
  return (
    selection.startLine === selection.endLine &&
    selection.startColumn === selection.endColumn
  )
}
