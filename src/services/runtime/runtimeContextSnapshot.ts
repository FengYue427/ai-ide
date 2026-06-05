/** v1.4.8 — read-only runtime context for Tab++ (ADR D7). */

import { getRecentRuntimeEvents, type RuntimeEvent } from './runtimeEventBus'
import { parseProjectTasks } from '../projectTasksService'

interface FileLike {
  name: string
  content: string
}

export interface RuntimeContextSnapshot {
  activeSpecPath: string | null
  firstOpenTaskText: string | null
  recentActivitySummaries: string[]
}

export function buildRuntimeContextSnapshot(
  files: FileLike[],
  activeSpecPath: string | null,
  events: RuntimeEvent[] = getRecentRuntimeEvents(5),
): RuntimeContextSnapshot {
  let firstOpenTaskText: string | null = null

  if (activeSpecPath) {
    const tasksFile = files.find((f) => f.name === activeSpecPath)
    if (tasksFile) {
      const open = parseProjectTasks(tasksFile.content).find((task) => !task.done)
      firstOpenTaskText = open?.text ?? null
    }
  }

  return {
    activeSpecPath,
    firstOpenTaskText,
    recentActivitySummaries: events.slice(-5).map((event) => event.message),
  }
}
