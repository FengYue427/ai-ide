/** v1.4 F3 — partial hunk stage for Git panel. */

import {
  applyPartialDiff,
  computeLineDiff,
  groupDiffHunks,
  type DiffLine,
} from './diffHunkService'
import { serviceText } from '../lib/serviceI18n'
import { getFileDiff, stageFile } from './gitService'

function filePathOnFs(dir: string, filepath: string): string {
  const prefix = dir === '/' ? '' : dir
  return `${prefix}/${filepath}`.replace(/\/+/g, '/')
}

async function writeWorkdirFile(fs: any, dir: string, filepath: string, content: string): Promise<void> {
  await fs.writeFile(filePathOnFs(dir, filepath), content)
}

export interface WorkdirHunkPreview {
  oldContent: string
  newContent: string
  diffLines: DiffLine[]
  hunks: DiffLine[][]
}

export async function loadWorkdirHunkPreview(
  fs: any,
  dir: string,
  filepath: string,
): Promise<WorkdirHunkPreview> {
  const { oldContent, newContent } = await getFileDiff(fs, dir, filepath)
  const diffLines = computeLineDiff(oldContent, newContent)
  return {
    oldContent,
    newContent,
    diffLines,
    hunks: groupDiffHunks(diffLines),
  }
}

/** Stage selected hunks: index gets partial apply; workdir keeps full content. */
export async function stageWorkdirHunks(
  fs: any,
  dir: string,
  filepath: string,
  acceptedHunkIndices: ReadonlySet<number>,
): Promise<void> {
  const preview = await loadWorkdirHunkPreview(fs, dir, filepath)
  if (preview.hunks.length === 0 || acceptedHunkIndices.size === 0) {
    throw new Error(serviceText('git.error.noHunksSelected'))
  }

  const stagedContent = applyPartialDiff(
    preview.oldContent,
    preview.diffLines,
    new Set(acceptedHunkIndices),
  )
  const fullWorkdir = preview.newContent

  await writeWorkdirFile(fs, dir, filepath, stagedContent)
  await stageFile(fs, dir, filepath)
  await writeWorkdirFile(fs, dir, filepath, fullWorkdir)
}
