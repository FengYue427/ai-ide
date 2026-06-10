import { describe, expect, it, vi } from 'vitest'
import {
  enqueueFirstOpenSpecTaskViaRuntime,
  findFirstOpenSpecTask,
  findFirstRunnableSpecTasksPath,
} from './specTaskExecutionService'

describe('specTaskExecutionService', () => {
  it('finds first open task', () => {
    const files = [{ name: '.aide/specs/x/tasks.md', content: '- [ ] A\n- [x] B\n', language: 'markdown' }]
    expect(findFirstOpenSpecTask(files, '.aide/specs/x/tasks.md')?.taskText).toBe('A')
  })

  it('finds first runnable spec path', () => {
    const files = [
      { name: '.aide/specs/done/tasks.md', content: '- [x] done\n', language: 'markdown' },
      { name: '.aide/specs/active/tasks.md', content: '- [ ] ship\n', language: 'markdown' },
    ]
    expect(findFirstRunnableSpecTasksPath(files)).toBe('.aide/specs/active/tasks.md')
  })

  it('enqueues via runtime coordinator', async () => {
    const setQueuedChatPrompt = vi.fn()
    const setQueuedSpecBackfill = vi.fn()
    const result = await enqueueFirstOpenSpecTaskViaRuntime(
      { tasksPath: '.aide/specs/x/tasks.md', language: 'zh-CN' },
      {
        getFiles: () => [{ name: '.aide/specs/x/tasks.md', content: '- [ ] Ship\n', language: 'markdown' }],
        setFiles: (files) => files,
        setQueuedChatPrompt,
        setQueuedSpecBackfill,
        appendSpecExecution: vi.fn(),
        getSpecQueueDepth: () => 0,
        getPlanQueueDepth: () => 0,
        hasActiveSpecBackfill: () => false,
      },
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.accepted).toBe(true)
      expect(setQueuedChatPrompt).toHaveBeenCalled()
    }
  })
})
