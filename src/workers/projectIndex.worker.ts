/**
 * Off-main-thread symbol index build (v1.0.2.4).
 */
import { buildIndexedFilesFromSources } from '../services/projectIndexBuildCore'
import type { IndexBuildSource } from '../services/projectIndexBuildCore'

const CHUNK_SIZE = 40

type BuildMessage = {
  type: 'build'
  sources: IndexBuildSource[]
}

type BuildResult =
  | { type: 'progress'; indexed: number; total: number }
  | { type: 'done'; files: ReturnType<typeof buildIndexedFilesFromSources> }
  | { type: 'error'; message: string }

self.onmessage = (event: MessageEvent<BuildMessage>) => {
  if (event.data.type !== 'build') return

  try {
    const sources = event.data.sources
    const total = sources.length
    const files: ReturnType<typeof buildIndexedFilesFromSources> = []

    for (let i = 0; i < sources.length; i += CHUNK_SIZE) {
      const chunk = sources.slice(i, i + CHUNK_SIZE)
      files.push(...buildIndexedFilesFromSources(chunk))
      const indexed = Math.min(i + chunk.length, total)
      const progress: BuildResult = { type: 'progress', indexed, total }
      self.postMessage(progress)
    }

    const done: BuildResult = { type: 'done', files }
    self.postMessage(done)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const err: BuildResult = { type: 'error', message }
    self.postMessage(err)
  }
}

export {}
