/**
 * Phase 7.2 — lightweight comments on read-only share progress pages.
 */
export interface ShareProgressComment {
  id: string
  author: string
  body: string
  createdAt: string
}

const KEY_PREFIX = 'aide:share-progress-comments:'

function readComments(shareId: string): ShareProgressComment[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${shareId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShareProgressComment[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeComments(shareId: string, comments: ShareProgressComment[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(`${KEY_PREFIX}${shareId}`, JSON.stringify(comments.slice(-40)))
}

export function listShareProgressComments(shareId: string): ShareProgressComment[] {
  return readComments(shareId)
}

export function addShareProgressComment(
  shareId: string,
  input: { author: string; body: string },
): ShareProgressComment {
  const comment: ShareProgressComment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: input.author.trim() || 'Guest',
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  }
  writeComments(shareId, [...readComments(shareId), comment])
  return comment
}
