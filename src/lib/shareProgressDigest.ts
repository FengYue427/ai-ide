import type { ShareProgressViewModel } from './shareProgressView'

/** Stable digest for local "share progress updated" detection. */
export function buildShareProgressDigest(view: ShareProgressViewModel): string {
  const specProgress =
    view.intentSnapshot?.specs.map((spec) => `${spec.slug}:${spec.doneTasks}/${spec.totalTasks}`).join('|') ?? ''
  return [
    view.weeklyRecap.doneTaskCount,
    view.weeklyRecap.openTaskCount,
    view.weeklyRecap.specCount,
    view.weeklyRecap.proofReportCount,
    specProgress,
    view.intentSnapshot?.graph.nodes.length ?? 0,
  ].join(':')
}
