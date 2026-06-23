import type { LinkageOverlayEdge, LinkageOverlayNode } from '../services/intentOs/intentLinkageGraphService'

export interface LinkageLayoutNode {
  id: string
  x: number
  y: number
  label: string
  kind: LinkageOverlayNode['kind']
  status?: LinkageOverlayNode['status']
}

export interface LinkageLayoutEdge {
  from: string
  to: string
  kind: LinkageOverlayEdge['kind']
}

const ROW_ORDER: Array<(node: LinkageOverlayNode) => boolean> = [
  (node) => node.id === 'link:goal',
  (node) => node.id.startsWith('link:goal:task:'),
  (node) => node.id.startsWith('task:'),
  (node) => ['git', 'queue', 'mode', 'bg-job', 'autopilot', 'share'].includes(node.kind),
]

function rowIndex(node: LinkageOverlayNode): number {
  const index = ROW_ORDER.findIndex((match) => match(node))
  return index >= 0 ? index : ROW_ORDER.length
}

/** Simple layered layout for linkage overlay mini-graph. */
export function layoutLinkageOverlayGraph(
  nodes: LinkageOverlayNode[],
  edges: LinkageOverlayEdge[],
  width = 280,
  height = 120,
): { nodes: LinkageLayoutNode[]; edges: LinkageLayoutEdge[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] }
  }

  const paddingX = 24
  const paddingY = 16
  const rowCount = Math.max(1, ROW_ORDER.length)
  const rowHeight = (height - paddingY * 2) / rowCount

  const buckets = new Map<number, LinkageOverlayNode[]>()
  for (const node of nodes) {
    const row = rowIndex(node)
    const list = buckets.get(row) ?? []
    list.push(node)
    buckets.set(row, list)
  }

  const layoutNodes: LinkageLayoutNode[] = []
  for (const [row, rowNodes] of buckets.entries()) {
    const y = paddingY + row * rowHeight + rowHeight / 2
    const span = width - paddingX * 2
    rowNodes.forEach((node, index) => {
      const x =
        rowNodes.length === 1
          ? width / 2
          : paddingX + (span * index) / Math.max(1, rowNodes.length - 1)
      layoutNodes.push({
        id: node.id,
        x,
        y,
        label: node.label,
        kind: node.kind,
        status: node.status,
      })
    })
  }

  const positioned = new Set(layoutNodes.map((node) => node.id))
  const layoutEdges = edges
    .filter((edge) => positioned.has(edge.from) && positioned.has(edge.to))
    .map((edge) => ({ from: edge.from, to: edge.to, kind: edge.kind }))

  return { nodes: layoutNodes, edges: layoutEdges }
}

export function linkageEdgeStroke(kind: LinkageOverlayEdge['kind']): string {
  switch (kind) {
    case 'blocks':
      return 'var(--warning-color, #c90)'
    case 'enables':
    case 'spawns':
      return 'var(--accent-color)'
    default:
      return 'var(--text-secondary)'
  }
}
