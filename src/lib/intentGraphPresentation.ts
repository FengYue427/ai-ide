import { GitBranch, Link2, ListChecks, FileText, type LucideIcon } from 'lucide-react'
import type { IntentGraph, IntentGraphNode } from '../services/intentOs/intentGraphService'

export const INTENT_GRAPH_GROUPS: Array<{
  key: string
  kinds: IntentGraphNode['kind'][]
  labelKey: 'intent.graph.group.plan' | 'intent.graph.group.tasks' | 'intent.graph.group.acceptance'
}> = [
  { key: 'plan', kinds: ['plan', 'plan-step'], labelKey: 'intent.graph.group.plan' },
  { key: 'tasks', kinds: ['spec-task'], labelKey: 'intent.graph.group.tasks' },
  { key: 'acceptance', kinds: ['acceptance'], labelKey: 'intent.graph.group.acceptance' },
]

export function intentGraphNodeIcon(kind: IntentGraphNode['kind']): LucideIcon {
  switch (kind) {
    case 'plan':
      return GitBranch
    case 'plan-step':
      return Link2
    case 'spec-task':
      return ListChecks
    default:
      return FileText
  }
}

export function groupIntentGraphNodes(nodes: IntentGraphNode[]) {
  return INTENT_GRAPH_GROUPS.map((group) => ({
    ...group,
    nodes: nodes.filter((node) => group.kinds.includes(node.kind)),
  })).filter((group) => group.nodes.length > 0)
}

export function intentGraphNodeClassName(
  node: IntentGraphNode,
  opts: { graphV2?: boolean; highlightTaskText?: string | null; previewLocked?: boolean },
): string {
  const labelNorm = node.label.trim().toLowerCase()
  const taskNorm = opts.highlightTaskText?.trim().toLowerCase() ?? ''
  const isNextTask =
    opts.graphV2 &&
    node.kind === 'spec-task' &&
    taskNorm.length > 0 &&
    (labelNorm === taskNorm.slice(0, 80) || taskNorm.startsWith(labelNorm))

  return [
    'intent-graph-node',
    `intent-graph-node--${node.kind}`,
    `intent-graph-node--${node.status ?? 'linked'}`,
    opts.graphV2 && node.status === 'open' ? 'intent-graph-node--v2-open' : '',
    isNextTask ? 'intent-graph-node--next' : '',
    opts.previewLocked ? 'intent-graph-node--preview-locked' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export type IntentGraphGroupLabelKey = (typeof INTENT_GRAPH_GROUPS)[number]['labelKey']

export function summarizeIntentGraph(graph: IntentGraph): { nodeCount: number; edgeCount: number } {
  return { nodeCount: graph.nodes.length, edgeCount: graph.edges.length }
}
