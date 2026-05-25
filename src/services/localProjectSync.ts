import { localProjectService } from './localProjectService'
import { normalizeProjectPath } from './localProjectPaths'

/** Write editor/workspace changes back to bound local folder. */
export async function syncToLocalDisk(path: string, content: string): Promise<void> {
  if (!localProjectService.isBound()) return
  const normalized = normalizeProjectPath(path)
  if (!normalized) return
  try {
    await localProjectService.writeFile(normalized, content)
  } catch (e) {
    console.warn('[localProjectSync] write failed:', normalized, e)
  }
}
