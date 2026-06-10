import { useMemo } from 'react'
import { useIDEStore } from '../store/ideStore'
import { buildIdeSpecQueueCoordinatorDeps, type SpecQueueCoordinatorDeps } from '../services/runtime/runtimeQueueCoordinator'

/** Single memoized Runtime queue adapter for Spec/Plan execution (IDE store). */
export function useSpecQueueCoordinatorDeps(): SpecQueueCoordinatorDeps {
  const setFiles = useIDEStore((s) => s.setFiles)
  const setQueuedChatPrompt = useIDEStore((s) => s.setQueuedChatPrompt)
  const setQueuedSpecBackfill = useIDEStore((s) => s.setQueuedSpecBackfill)
  const setQueuedSpecExecutions = useIDEStore((s) => s.setQueuedSpecExecutions)

  return useMemo(
    () =>
      buildIdeSpecQueueCoordinatorDeps({
        setFiles,
        setQueuedChatPrompt,
        setQueuedSpecBackfill,
        setQueuedSpecExecutions,
      }),
    [setFiles, setQueuedChatPrompt, setQueuedSpecBackfill, setQueuedSpecExecutions],
  )
}
