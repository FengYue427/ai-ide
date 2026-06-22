import type { PlanSpecLink } from '../planSpecLinkService'
import { readPlanSpecLinks } from '../planSpecLinkService'
import { listSpecTasksPaths } from '../planSpecsBridgeService'
import type { FileItem } from '../../types/file'
import { acceptancePathFromTasksPath } from '../../lib/specStudioPaths'
import { parseProjectTasks } from '../projectTasksService'

export type IntentGraphNodeKind = 'plan' | 'plan-step' | 'spec-task' | 'acceptance' | 'file'

export interface IntentGraphNode {
  id: string
  kind: IntentGraphNodeKind
  label: string
  path?: string
  status?: 'open' | 'done' | 'linked'
}

export interface IntentGraphEdge {
  from: string
  to: string
  label?: string
}

export interface IntentGraph {
  nodes: IntentGraphNode[]
  edges: IntentGraphEdge[]
}

interface BuildIntentGraphInput {
  files: FileItem[]
  links?: PlanSpecLink[]
  focusTasksPath?: string | null
}

function planLabel(path: string): string {
  return path.split('/').pop()?.replace(/\.md$/i, '') ?? path
}

/** S1 — simplified trace graph from plan-spec links + open tasks. */
export function buildIntentGraph(input: BuildIntentGraphInput): IntentGraph {
  const links = input.links ?? readPlanSpecLinks(input.files)
  const nodes: IntentGraphNode[] = []
  const edges: IntentGraphEdge[] = []
  const nodeIds = new Set<string>()

  const addNode = (node: IntentGraphNode) => {
    if (nodeIds.has(node.id)) return
    nodeIds.add(node.id)
    nodes.push(node)
  }

  const addEdge = (from: string, to: string, label?: string) => {
    if (!nodeIds.has(from) || !nodeIds.has(to)) return
    edges.push({ from, to, label })
  }

  const focus = input.focusTasksPath?.replace(/\\/g, '/')
  const relevantLinks = focus ? links.filter((l) => l.specTasksPath === focus) : links

  for (const link of relevantLinks) {
    const planId = `plan:${link.planPath}`
    const stepId = `step:${link.planPath}:${link.planStepText}`
    const taskId = `task:${link.specTasksPath}:${link.specTaskText}`
    addNode({ id: planId, kind: 'plan', label: planLabel(link.planPath), path: link.planPath })
    addNode({
      id: stepId,
      kind: 'plan-step',
      label: link.planStepText.slice(0, 80),
      path: link.planPath,
      status: 'linked',
    })
    addNode({
      id: taskId,
      kind: 'spec-task',
      label: link.specTaskText.slice(0, 80),
      path: link.specTasksPath,
      status: 'linked',
    })
    addEdge(planId, stepId, 'contains')
    addEdge(stepId, taskId, 'maps')
  }

  const tasksPaths = focus
    ? [focus]
    : links.length > 0
      ? [...new Set(links.map((l) => l.specTasksPath))]
      : listSpecTasksPaths(input.files)

  for (const tasksPath of tasksPaths) {
    const file = input.files.find((f) => f.name.replace(/\\/g, '/') === tasksPath)
    if (!file) continue
    const accPath = acceptancePathFromTasksPath(tasksPath)
    const accId = `acc:${accPath}`
    addNode({ id: accId, kind: 'acceptance', label: 'acceptance.md', path: accPath })

    for (const task of parseProjectTasks(file.content)) {
      const taskId = `task:${tasksPath}:${task.text}`
      addNode({
        id: taskId,
        kind: 'spec-task',
        label: task.text.slice(0, 80),
        path: tasksPath,
        status: task.done ? 'done' : 'open',
      })
      addEdge(taskId, accId, 'verify')
    }
  }

  return { nodes, edges }
}

/** C1/C5 — merge proof or share snapshot nodes into live graph for shell display. */
export function mergeIntentGraphWithReplay(live: IntentGraph, overlay: IntentGraph | null): IntentGraph {
  if (!overlay || overlay.nodes.length === 0) return live

  const nodeMap = new Map(live.nodes.map((node) => [node.id, node]))
  for (const node of overlay.nodes) {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, { ...node, status: node.status ?? 'linked' })
    }
  }

  const edgeKeys = new Set(live.edges.map((edge) => `${edge.from}->${edge.to}`))
  const edges = [...live.edges]
  for (const edge of overlay.edges) {
    const key = `${edge.from}->${edge.to}`
    if (!edgeKeys.has(key)) {
      edges.push(edge)
      edgeKeys.add(key)
    }
  }

  return { nodes: [...nodeMap.values()], edges }
}
