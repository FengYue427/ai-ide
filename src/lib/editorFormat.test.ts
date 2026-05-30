import { describe, expect, it } from 'vitest'
import { canFormatFile, isEditorWritableForFormat } from './editorFormat'

describe('canFormatFile', () => {
  it('accepts common script and markup extensions', () => {
    expect(canFormatFile({ name: 'app.tsx', language: 'plaintext' })).toBe(true)
    expect(canFormatFile({ name: 'styles.css', language: 'plaintext' })).toBe(true)
  })

  it('accepts known Monaco language ids', () => {
    expect(canFormatFile({ name: 'untitled', language: 'typescript' })).toBe(true)
  })

  it('rejects unsupported files', () => {
    expect(canFormatFile({ name: 'image.png', language: 'plaintext' })).toBe(false)
  })
})

describe('isEditorWritableForFormat', () => {
  it('allows format outside collab rooms', () => {
    expect(isEditorWritableForFormat({ collaborationRoomId: null, collaborationMemberRole: null })).toBe(true)
  })

  it('blocks viewers in collab rooms', () => {
    expect(
      isEditorWritableForFormat({ collaborationRoomId: 'room-1', collaborationMemberRole: 'viewer' }),
    ).toBe(false)
  })

  it('allows editors in collab rooms', () => {
    expect(
      isEditorWritableForFormat({ collaborationRoomId: 'room-1', collaborationMemberRole: 'editor' }),
    ).toBe(true)
  })
})
