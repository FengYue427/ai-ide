export const INTENT_SHARE_META_PATH = '.aide/meta/intent-share.json'

export function normalizeShareFilePath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function shareFilesIncludeIntentSnapshot(files: Array<{ name: string }>): boolean {
  return files.some((file) => normalizeShareFilePath(file.name) === INTENT_SHARE_META_PATH)
}
