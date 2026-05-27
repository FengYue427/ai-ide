/**
 * Tracks whether the editor file list was loaded from storage (autosave / cloud / import),
 * not the built-in starter template. Autosave must not run until hydrated.
 */
let workspaceHydrated = false

export function markWorkspaceHydrated(): void {
  workspaceHydrated = true
}

export function resetWorkspaceHydration(): void {
  workspaceHydrated = false
}

export function isWorkspaceHydrated(): boolean {
  return workspaceHydrated
}

export type WorkspaceFileLike = { name: string; content: string; language?: string }

/** Prefer the snapshot with more files; tie-break by newer updatedAt when present. */
export function pickRicherFileSet<T extends WorkspaceFileLike>(
  a: T[] | null | undefined,
  b: T[] | null | undefined,
): T[] | null {
  const left = a?.length ? a : null
  const right = b?.length ? b : null
  if (!left) return right
  if (!right) return left
  if (right.length > left.length) return right
  if (left.length > right.length) return left
  return left
}
