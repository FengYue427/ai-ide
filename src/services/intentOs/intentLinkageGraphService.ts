import type { FileItem } from '../../types/file'
import { buildIntentGraph, type IntentGraph } from './intentGraphService'
import { readPlanSpecLinks } from '../planSpecLinkService'
import { findFirstOpenSpecTask } from '../specTaskExecutionService'
import { countOpenSpecTasks } from './autopilotLiteService'

export type LinkageNodeKind =
  | 'goal'
  | 'mode'
  | 'queue'
  | 'bg-job'
  | 'git'
  | 'share'
  | 'autopilot'

export type LinkageEdgeKind =
  | 'contains'
  | 'maps'
  | 'verify'
  | 'blocks'
  | 'enables'
  | 'spawns'
  | 'mirrors'

export interface LinkageOverlayNode {
  id: string
  kind: LinkageNodeKind
  label: string
  status?: 'open' | 'done' | 'active' | 'blocked' | 'idle'
}

export interface LinkageOverlayEdge {
  from: string
  to: string
  kind: LinkageEdgeKind
  label?: string
}

export interface IntentLinkageGraph {
  base: IntentGraph
  overlayNodes: LinkageOverlayNode[]
  overlayEdges: LinkageOverlayEdge[]
  focusTasksPath: string | null
  nextTaskText: string | null
  openTaskCount: number
}

export interface BuildIntentLinkageGraphInput {
  files: FileItem[]
  focusTasksPath?: string | null
  workspaceMode?: string
  gitModifiedCount?: number
  queueBusy?: boolean
  backgroundJobsActive?: number
  goalText?: string | null
  decomposedTasks?: string[]
  autopilotActive?: boolean
  shareLinked?: boolean
}

export function buildIntentLinkageGraph(input: BuildIntentLinkageGraphInput): IntentLinkageGraph {
  const focus = input.focusTasksPath?.replace(/\\/g, '/') ?? null
  const links = readPlanSpecLinks(input.files)
  const base = buildIntentGraph({ files: input.files, links, focusTasksPath: focus })
  const overlayNodes: LinkageOverlayNode[] = []
  const overlayEdges: LinkageOverlayEdge[] = []

  const addNode = (node: LinkageOverlayNode) => {
    if (overlayNodes.some((n) => n.id === node.id)) return
    overlayNodes.push(node)
  }
  const addEdge = (edge: LinkageOverlayEdge) => overlayEdges.push(edge)

  if (input.goalText?.trim()) {
    addNode({ id: 'link:goal', kind: 'goal', label: input.goalText.trim().slice(0, 80), status: 'active' })
    if (focus) addEdge({ from: 'link:goal', to: `task:${focus}:root`, kind: 'spawns', label: 'decompose' })

    const decomposed = input.decomposedTasks ?? []
    decomposed.forEach((task, index) => {
      const nodeId = `link:goal:task:${index}`
      addNode({
        id: nodeId,
        kind: 'goal',
        label: task.slice(0, 64),
        status: index === 0 ? 'open' : 'idle',
      })
      addEdge({ from: 'link:goal', to: nodeId, kind: 'spawns', label: 'llm-task' })
      if (focus) addEdge({ from: nodeId, to: `task:${focus}:root`, kind: 'maps' })
    })
  }

  if (input.workspaceMode) {
    addNode({
      id: 'link:mode',
      kind: 'mode',
      label: input.workspaceMode,
      status: input.workspaceMode === 'execute' ? 'active' : 'idle',
    })
    if (focus) addEdge({ from: 'link:mode', to: `task:${focus}:root`, kind: 'enables' })
  }

  const gitDirty = (input.gitModifiedCount ?? 0) > 0
  addNode({
    id: 'link:git',
    kind: 'git',
    label: gitDirty ? 'git-dirty' : 'git-clean',
    status: gitDirty ? 'blocked' : 'done',
  })
  if (focus) {
    addEdge({
      from: 'link:git',
      to: `task:${focus}:root`,
      kind: gitDirty ? 'blocks' : 'enables',
    })
  }

  addNode({
    id: 'link:queue',
    kind: 'queue',
    label: input.queueBusy ? 'queue-busy' : 'queue-idle',
    status: input.queueBusy ? 'active' : 'idle',
  })
  if (focus) addEdge({ from: 'link:queue', to: `task:${focus}:root`, kind: input.queueBusy ? 'blocks' : 'enables' })

  const jobs = input.backgroundJobsActive ?? 0
  addNode({
    id: 'link:bg-job',
    kind: 'bg-job',
    label: jobs > 0 ? `jobs:${jobs}` : 'jobs:idle',
    status: jobs > 0 ? 'active' : 'idle',
  })
  if (focus && jobs > 0) addEdge({ from: 'link:bg-job', to: `task:${focus}:root`, kind: 'mirrors' })

  if (input.autopilotActive) {
    addNode({ id: 'link:autopilot', kind: 'autopilot', label: 'autopilot', status: 'active' })
    if (focus) addEdge({ from: 'link:autopilot', to: `task:${focus}:root`, kind: 'spawns' })
  }

  if (input.shareLinked) {
    addNode({ id: 'link:share', kind: 'share', label: 'share-watch', status: 'open' })
    if (focus) addEdge({ from: `task:${focus}:root`, to: 'link:share', kind: 'mirrors' })
  }

  // Anchor node for overlay edges when no spec task nodes yet
  if (focus && !base.nodes.some((n) => n.path === focus)) {
    addNode({ id: `task:${focus}:root`, kind: 'queue', label: focus.split('/').slice(-2).join('/'), status: 'open' })
  }

  const openTaskCount = focus ? countOpenSpecTasks(input.files, focus) : 0
  const next = focus ? findFirstOpenSpecTask(input.files, focus) : null

  return {
    base,
    overlayNodes,
    overlayEdges,
    focusTasksPath: focus,
    nextTaskText: next?.taskText ?? null,
    openTaskCount,
  }
}

export function summarizeIntentLinkageGraph(graph: IntentLinkageGraph): {
  baseNodes: number
  baseEdges: number
  overlayNodes: number
  overlayEdges: number
  openTasks: number
} {
  return {
    baseNodes: graph.base.nodes.length,
    baseEdges: graph.base.edges.length,
    overlayNodes: graph.overlayNodes.length,
    overlayEdges: graph.overlayEdges.length,
    openTasks: graph.openTaskCount,
  }
}
