/**
 * Unified language service entry (v1.2.1 F4).
 * See docs/ADR_V1.2_LANGUAGE_SERVICE.md
 */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  registerCrossFileDefinitionProvider,
  type DefinitionProjectFile,
} from './registerCrossFileDefinition'
import { registerCrossFileReferenceProvider } from './registerCrossFileReferences'
import { registerCrossFileHoverProvider } from './registerCrossFileHover'
import {
  goToDefinition,
  goToReferences,
  type GoToDefinitionRequest,
  type GoToReferencesRequest,
} from './languageServiceHostCore'

export type { DefinitionProjectFile, GoToDefinitionRequest, GoToReferencesRequest }
export { goToDefinition, goToReferences }

/** Register Monaco definition + reference providers for in-memory workspace files. */
export function registerLanguageServiceProviders(
  files: DefinitionProjectFile[],
  currentFile: string,
): monaco.IDisposable {
  const definitionDisposable = registerCrossFileDefinitionProvider(files, currentFile)
  const referenceDisposable = registerCrossFileReferenceProvider(files, currentFile)
  const hoverDisposable = registerCrossFileHoverProvider(currentFile)
  return {
    dispose() {
      definitionDisposable.dispose()
      referenceDisposable.dispose()
      hoverDisposable.dispose()
    },
  }
}
