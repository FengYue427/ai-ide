import { describe, expect, it } from 'vitest'
import {
  isTypeScriptLikeLanguage,
  libUriStringToEditorUriString,
  libUriStringToWorkspacePath,
  workspacePathToLibUriString,
} from './editorModelUri'

describe('editorModelUri', () => {
  it('maps workspace paths to file lib URIs', () => {
    expect(workspacePathToLibUriString('src/foo.ts')).toBe('file:///src/foo.ts')
    expect(workspacePathToLibUriString('\\src\\foo.ts')).toBe('file:///src/foo.ts')
  })

  it('converts lib URIs to inmemory editor URIs', () => {
    expect(libUriStringToEditorUriString('file:///sample.ts')).toBe('inmemory://sample.ts')
  })

  it('extracts workspace paths from lib or inmemory URIs', () => {
    expect(libUriStringToWorkspacePath('file:///a/b.ts')).toBe('a/b.ts')
    expect(libUriStringToWorkspacePath('inmemory://a/b.ts')).toBe('a/b.ts')
  })

  it('detects TS-like languages', () => {
    expect(isTypeScriptLikeLanguage('typescript')).toBe(true)
    expect(isTypeScriptLikeLanguage('plaintext')).toBe(false)
  })
})
