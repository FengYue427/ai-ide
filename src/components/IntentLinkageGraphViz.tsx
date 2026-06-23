import { memo, useMemo } from 'react'
import type { LinkageOverlayEdge, LinkageOverlayNode } from '../services/intentOs/intentLinkageGraphService'
import { layoutLinkageOverlayGraph, linkageEdgeStroke } from '../lib/linkageGraphLayout'
import {
  isLinkageOverlayNavigable,
  resolveLinkageOverlayNavigate,
  type LinkageOverlayNavigateTarget,
} from '../lib/linkageOverlayNavigation'

interface IntentLinkageGraphVizProps {
  nodes: LinkageOverlayNode[]
  edges: LinkageOverlayEdge[]
  focusTasksPath?: string | null
  onNavigate?: (target: LinkageOverlayNavigateTarget) => void
}

const NODE_R = 10

export const IntentLinkageGraphViz = memo(function IntentLinkageGraphViz({
  nodes,
  edges,
  focusTasksPath,
  onNavigate,
}: IntentLinkageGraphVizProps) {
  const layout = useMemo(() => layoutLinkageOverlayGraph(nodes, edges), [edges, nodes])

  if (layout.nodes.length === 0) return null

  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]))
  const width = 280
  const height = 120

  const handleNodeClick = (nodeId: string) => {
    if (!onNavigate) return
    const overlay = nodes.find((item) => item.id === nodeId)
    if (!overlay) return
    const target = resolveLinkageOverlayNavigate(overlay, focusTasksPath ?? null)
    if (target) onNavigate(target)
  }

  return (
    <svg
      className="intent-linkage-graph-viz"
      data-testid="intent-linkage-graph-viz"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-hidden
    >
      {layout.edges.map((edge, index) => {
        const from = nodeById.get(edge.from)
        const to = nodeById.get(edge.to)
        if (!from || !to) return null
        return (
          <line
            key={`${edge.from}-${edge.to}-${index}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className={`intent-linkage-graph-viz__edge intent-linkage-graph-viz__edge--${edge.kind}`}
            stroke={linkageEdgeStroke(edge.kind)}
            strokeWidth={edge.kind === 'blocks' ? 2 : 1.5}
            strokeDasharray={edge.kind === 'mirrors' ? '3 2' : undefined}
          />
        )
      })}
      {layout.nodes.map((node) => {
        const overlay = nodes.find((item) => item.id === node.id)
        const navigable =
          Boolean(onNavigate) &&
          overlay &&
          isLinkageOverlayNavigable(overlay, focusTasksPath ?? null)
        return (
          <g
            key={node.id}
            className={`intent-linkage-graph-viz__node intent-linkage-graph-viz__node--${node.kind}${navigable ? ' intent-linkage-graph-viz__node--clickable' : ''}`}
            data-testid={`intent-linkage-viz-node-${node.id}`}
            onClick={() => handleNodeClick(node.id)}
            style={{ cursor: navigable ? 'pointer' : 'default' }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={NODE_R}
              className={`intent-linkage-graph-viz__dot intent-linkage-graph-viz__dot--${node.status ?? 'idle'}`}
            />
            <title>{node.label}</title>
          </g>
        )
      })}
    </svg>
  )
})
