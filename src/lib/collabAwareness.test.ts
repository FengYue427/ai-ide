import { describe, expect, it } from 'vitest'
import {
  buildRemoteCollabDecorations,
  isCollapsedSelection,
  listRemotePresences,
  parseCollabAwarenessUser,
  withAlpha,
} from './collabAwareness'

describe('collabAwareness', () => {
  it('parseCollabAwarenessUser reads cursor and selection', () => {
    const user = parseCollabAwarenessUser({
      name: 'Alice',
      color: '#ff0000',
      cursor: { filePath: 'a.js', line: 2, column: 5 },
      selection: {
        filePath: 'a.js',
        startLine: 2,
        startColumn: 5,
        endLine: 3,
        endColumn: 1,
      },
    })
    expect(user?.name).toBe('Alice')
    expect(user?.cursor?.line).toBe(2)
    expect(user?.selection?.endLine).toBe(3)
  })

  it('listRemotePresences filters local client and other files', () => {
    const states = new Map<number, Record<string, unknown>>([
      [
        1,
        {
          user: {
            name: 'Me',
            color: '#58a6ff',
            cursor: { filePath: 'a.js', line: 1, column: 1 },
          },
        },
      ],
      [
        2,
        {
          user: {
            name: 'Bob',
            color: '#33c58e',
            cursor: { filePath: 'b.js', line: 1, column: 1 },
          },
        },
      ],
      [
        3,
        {
          user: {
            name: 'Carol',
            color: '#ffb648',
            cursor: { filePath: 'a.js', line: 4, column: 2 },
            selection: {
              filePath: 'a.js',
              startLine: 4,
              startColumn: 2,
              endLine: 4,
              endColumn: 8,
            },
          },
        },
      ],
    ])

    const remote = listRemotePresences(states, 1, 'a.js')
    expect(remote).toHaveLength(1)
    expect(remote[0].user.name).toBe('Carol')
  })

  it('buildRemoteCollabDecorations includes selection and cursor', () => {
    const monacoApi = {
      Range: class {
        constructor(
          public startLineNumber: number,
          public startColumn: number,
          public endLineNumber: number,
          public endColumn: number,
        ) {}
      },
      editor: {
        TrackedRangeStickiness: {
          NeverGrowsWhenTypingAtEdges: 1,
        },
      },
    } as never

    const decorations = buildRemoteCollabDecorations(monacoApi, [
      {
        clientId: 9,
        user: {
          name: 'Carol',
          color: '#ffb648',
          cursor: { filePath: 'a.js', line: 4, column: 8 },
          selection: {
            filePath: 'a.js',
            startLine: 4,
            startColumn: 2,
            endLine: 4,
            endColumn: 8,
          },
        },
      },
    ])

    expect(decorations).toHaveLength(2)
    expect(decorations[0].options?.inlineClassName).toBe('collab-remote-sel-9')
    expect(decorations[1].options?.before?.inlineClassName).toBe('collab-remote-cursor-9')
  })

  it('withAlpha converts hex to rgba', () => {
    expect(withAlpha('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('isCollapsedSelection detects caret-only ranges', () => {
    expect(
      isCollapsedSelection({ startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }),
    ).toBe(true)
  })
})
