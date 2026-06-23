import type { FileItem } from '../types/file'
import { buildShareProgressDigest } from './shareProgressDigest'
import { buildShareProgressViewModel } from './shareProgressView'
import { getLinkedWorkspaceShareId } from './shareWorkspaceLink'
import { isShareProgressWatched, signalShareProgressLocalDigest } from './shareProgressWatch'

/** After local Spec progress (e.g. background autopilot), flag watched Share digests. */
export function syncLinkedShareProgressFromFiles(
  files: FileItem[],
  workspaceKey?: string | null,
): { shareId: string; digest: string } | null {
  const shareId = getLinkedWorkspaceShareId(workspaceKey)
  if (!shareId || !isShareProgressWatched(shareId)) return null
  const digest = buildShareProgressDigest(buildShareProgressViewModel(files))
  const changed = signalShareProgressLocalDigest(shareId, digest)
  return changed ? { shareId, digest } : null
}
