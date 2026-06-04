import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import {
  isTypeScriptLikeLanguage,
  libUriStringToEditorUriString,
  libUriStringToWorkspacePath,
  workspacePathToLibUriString,
} from './editorModelUri'

type TsTextSpan = { start: number; length: number }
type TsDefinitionEntry = { fileName: string; textSpan: TsTextSpan }

function textSpanToRange(model: monaco.editor.ITextModel, span: TsTextSpan): monaco.IRange {
  const start = model.getPositionAt(span.start)
  const end = model.getPositionAt(span.start + span.length)
  return {
    startLineNumber: start.lineNumber,
    startColumn: start.column,
    endLineNumber: end.lineNumber,
    endColumn: end.column,
  }
}

function modelForLibEntry(fileName: string): monaco.editor.ITextModel | null {
  const libUri = monaco.Uri.parse(fileName)
  const existing = monaco.editor.getModel(libUri)
  if (existing) return existing

  const extraLibs = monaco.languages.typescript.typescriptDefaults.getExtraLibs()
  const lib = extraLibs[fileName] ?? extraLibs[libUri.toString()]
  if (!lib?.content) return null

  return monaco.editor.createModel(lib.content, 'typescript', libUri)
}

function entryToLocation(entry: TsDefinitionEntry): monaco.languages.Location | null {
  const refModel = modelForLibEntry(entry.fileName)
  if (!refModel) {
    return {
      uri: monaco.Uri.parse(libUriStringToEditorUriString(entry.fileName)),
      range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
    }
  }

  const range = textSpanToRange(refModel, entry.textSpan)

  return {
    uri: monaco.Uri.parse(libUriStringToEditorUriString(entry.fileName)),
    range,
  }
}

async function getWorkerForModel(model: monaco.editor.ITextModel) {
  const isTs =
    model.getLanguageId() === 'typescript' || model.getLanguageId() === 'typescriptreact'
  const getWorker = isTs
    ? monaco.languages.typescript.getTypeScriptWorker
    : monaco.languages.typescript.getJavaScriptWorker
  const accessor = await getWorker()
  return accessor(model.uri)
}

export function resolveModelLibUri(model: monaco.editor.ITextModel, workspaceFilename: string): string {
  if (model.uri.scheme === 'file') return model.uri.toString()
  if (model.uri.scheme === 'inmemory') {
    const path = libUriStringToWorkspacePath(model.uri.toString())
    if (path) return workspacePathToLibUriString(path)
  }
  return workspacePathToLibUriString(workspaceFilename)
}

export async function getMonacoTypeScriptDefinitions(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  workspaceFilename: string,
): Promise<monaco.languages.Location[] | null> {
  if (!isTypeScriptLikeLanguage(model.getLanguageId())) return null

  const word = model.getWordAtPosition(position)
  if (!word?.word) return null

  const libUri = resolveModelLibUri(model, workspaceFilename)
  const libModel =
    monaco.editor.getModel(monaco.Uri.parse(libUri)) ??
    modelForLibEntry(libUri) ??
    (model.uri.toString() === libUri ? model : null)
  if (!libModel) return null

  const offset = libModel.getOffsetAt(position)
  try {
    const worker = await getWorkerForModel(libModel)
    const entries = (await worker.getDefinitionAtPosition(libUri, offset)) as
      | TsDefinitionEntry[]
      | undefined
    if (!entries?.length) return null
    return entries.map(entryToLocation).filter((loc): loc is monaco.languages.Location => loc != null)
  } catch {
    return null
  }
}

export async function getMonacoTypeScriptReferences(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  workspaceFilename: string,
): Promise<monaco.languages.Location[] | null> {
  if (!isTypeScriptLikeLanguage(model.getLanguageId())) return null

  const word = model.getWordAtPosition(position)
  if (!word?.word) return null

  const libUri = resolveModelLibUri(model, workspaceFilename)
  const libModel =
    monaco.editor.getModel(monaco.Uri.parse(libUri)) ??
    modelForLibEntry(libUri) ??
    (model.uri.toString() === libUri ? model : null)
  if (!libModel) return null

  const offset = libModel.getOffsetAt(position)
  try {
    const worker = await getWorkerForModel(libModel)
    const entries = (await worker.getReferencesAtPosition(libUri, offset)) as
      | TsDefinitionEntry[]
      | undefined
    if (!entries?.length) return null
    return entries.map(entryToLocation).filter((loc): loc is monaco.languages.Location => loc != null)
  } catch {
    return null
  }
}
