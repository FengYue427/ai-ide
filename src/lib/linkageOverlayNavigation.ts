import type { LinkageOverlayNode } from '../services/intentOs/intentLinkageGraphService'

export type LinkageOverlayNavigateTarget =
  | { kind: 'tasks'; path: string }
  | { kind: 'git' }
  | { kind: 'background-jobs' }
  | { kind: 'share' }

export function resolveLinkageOverlayNavigate(
  node: LinkageOverlayNode,
  focusTasksPath: string | null,
): LinkageOverlayNavigateTarget | null {
  const tasksPath = focusTasksPath?.replace(/\\/g, '/') ?? null

  if (node.id.startsWith('task:') && tasksPath) {
    return { kind: 'tasks', path: tasksPath }
  }

  switch (node.kind) {
    case 'git':
      return { kind: 'git' }
    case 'queue':
      return tasksPath ? { kind: 'tasks', path: tasksPath } : null
    case 'bg-job':
      return { kind: 'background-jobs' }
    case 'share':
      return { kind: 'share' }
    case 'goal':
      if (node.id.startsWith('link:goal:task:') && tasksPath) {
        return { kind: 'tasks', path: tasksPath }
      }
      return null
    default:
      return null
  }
}

export function isLinkageOverlayNavigable(
  node: LinkageOverlayNode,
  focusTasksPath: string | null,
): boolean {
  return resolveLinkageOverlayNavigate(node, focusTasksPath) !== null
}
