/**
 * Pure index build helpers (safe for Web Worker — no window / desktop bridge).
 */
import {
  detectLanguageFromPath,
  extractSymbolsFromContent,
  type IndexedFile,
  type ProjectIndex,
} from './projectIndexService'

export type IndexBuildSource = { path: string; content: string; language?: string }

export function buildIndexedFilesFromSources(sources: IndexBuildSource[]): IndexedFile[] {
  return sources.map((source) => ({
    path: source.path,
    language: source.language ?? detectLanguageFromPath(source.path),
    symbols: extractSymbolsFromContent(source.path, source.content),
  }))
}

export function assembleProjectIndex(files: IndexedFile[]): ProjectIndex {
  return { files, builtAt: Date.now() }
}
