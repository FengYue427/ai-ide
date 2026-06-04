/** Align Monaco editor models with `syncTypeScriptProject` extra-lib paths (`file:///`). */

export function workspacePathToLibUriString(name: string): string {
  const normalized = name.replace(/\\/g, '/').replace(/^\//, '')
  return `file:///${normalized}`
}

export function libUriStringToWorkspacePath(uri: string): string {
  return uri.replace(/^file:\/\//, '').replace(/^inmemory:\/\//, '').replace(/^\//, '')
}

/** In-memory tabs use `inmemory://` while the TS worker uses `file:///`. */
export function libUriStringToEditorUriString(libUri: string): string {
  const path = libUriStringToWorkspacePath(libUri)
  return `inmemory://${path}`
}

export function isTypeScriptLikeLanguage(languageId: string): boolean {
  return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId)
}
