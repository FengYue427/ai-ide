/**
 * Unified language service entry (v1.2.1 F4).
 * See docs/ADR_V1.2_LANGUAGE_SERVICE.md
 */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  registerCrossFileDefinitionProvider,
  type DefinitionProjectFile,
} from './registerCrossFileDefinition'
import { goToDefinition, type GoToDefinitionRequest } from './languageServiceHostCore'

export type { DefinitionProjectFile, GoToDefinitionRequest }
export { goToDefinition }

/** Register Monaco definition providers for in-memory workspace files. */
export function registerLanguageServiceProviders(
  files: DefinitionProjectFile[],
  currentFile: string,
): monaco.IDisposable {
  return registerCrossFileDefinitionProvider(files, currentFile)
}
