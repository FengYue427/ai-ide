/** Links the most recent Share id to the active workspace (local progress sync). */
const STORAGE_KEY = 'aide:share-workspace-link'

export interface ShareWorkspaceLink {
  workspaceKey: string
  shareId: string
  linkedAt: string
}

function readLinks(): ShareWorkspaceLink[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ShareWorkspaceLink[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLinks(links: ShareWorkspaceLink[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(-12)))
}

export function workspaceShareKey(workspaceKey?: string | null): string {
  return (workspaceKey?.trim() || 'default').slice(0, 128)
}

export function linkWorkspaceShare(shareId: string, workspaceKey?: string | null): void {
  const key = workspaceShareKey(workspaceKey)
  const list = readLinks().filter((row) => row.workspaceKey !== key)
  list.push({ workspaceKey: key, shareId, linkedAt: new Date().toISOString() })
  writeLinks(list)
}

export function getLinkedWorkspaceShareId(workspaceKey?: string | null): string | null {
  const key = workspaceShareKey(workspaceKey)
  return readLinks().find((row) => row.workspaceKey === key)?.shareId ?? null
}
