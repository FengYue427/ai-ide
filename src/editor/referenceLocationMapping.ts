import type { ReferenceLocation } from '../services/referenceIndexService'
import { libUriStringToWorkspacePath } from './editorModelUri'

export interface MonacoReferenceLike {
  uri: { toString(): string }
  range: {
    startLineNumber: number
    startColumn: number
  }
}

/** Map Monaco / TS Worker location to workspace-relative reference row (v1.2.9 F1). */
export function monacoLocationToReference(loc: MonacoReferenceLike): ReferenceLocation {
  return {
    path: libUriStringToWorkspacePath(loc.uri.toString()),
    line: loc.range.startLineNumber,
    column: loc.range.startColumn,
  }
}
