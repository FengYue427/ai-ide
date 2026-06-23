import type { LinkageOverlayNode } from '../services/intentOs/intentLinkageGraphService'
import type { IntentGraph } from '../services/intentOs/intentGraphService'
import { findFirstOpenSpecTask } from '../services/specTaskExecutionService'
import type { FileItem } from '../types/file'

export function linkageSyntheticTaskAnchorId(focus: string): string {
  const normalized = focus.replace(/\\/g, '/')
  return `task:${normalized}:root`
}

/** Resolve overlay edge target to a base-graph task id when possible. */
export function resolveLinkageTaskAnchorId(
  focus: string,
  base: IntentGraph,
  files?: FileItem[],
): string {
  const normalized = focus.replace(/\\/g, '/')

  if (files) {
    const open = findFirstOpenSpecTask(files, focus)
    if (open) return `task:${normalized}:${open.taskText}`
  }

  const openBase = base.nodes.find(
    (node) => node.kind === 'spec-task' && node.path === normalized && node.status !== 'done',
  )
  if (openBase) return openBase.id

  const anyBase = base.nodes.find((node) => node.kind === 'spec-task' && node.path === normalized)
  if (anyBase) return anyBase.id

  return linkageSyntheticTaskAnchorId(normalized)
}

export function isLinkageSyntheticTaskAnchor(anchorId: string, focus: string): boolean {
  return anchorId === linkageSyntheticTaskAnchorId(focus)
}

export function linkageTaskAnchorOverlayNode(
  anchorId: string,
  focus: string,
  base: IntentGraph,
): LinkageOverlayNode {
  const baseNode = base.nodes.find((node) => node.id === anchorId)
  if (baseNode?.kind === 'spec-task') {
    return {
      id: anchorId,
      kind: 'queue',
      label: baseNode.label,
      status: baseNode.status === 'done' ? 'done' : 'open',
    }
  }

  const normalized = focus.replace(/\\/g, '/')
  return {
    id: anchorId,
    kind: 'queue',
    label: normalized.split('/').slice(-2).join('/'),
    status: 'open',
  }
}
