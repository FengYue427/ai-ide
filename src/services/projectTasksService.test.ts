import { describe, expect, it } from 'vitest'
import { extractProjectTasks, parseProjectTasks, summarizeProjectTasks } from './projectTasksService'

describe('projectTasksService', () => {
  it('parses markdown checkboxes', () => {
    const items = parseProjectTasks(`# Plan
- [ ] First task
- [x] Done task
`)
    expect(items).toHaveLength(2)
    expect(items[0].done).toBe(false)
    expect(items[1].done).toBe(true)
  })

  it('extracts from .aide/tasks.md', () => {
    const items = extractProjectTasks([{ path: '.aide/tasks.md', content: '- [ ] Ship v1.0.2.6' }])
    expect(items[0].text).toBe('Ship v1.0.2.6')
  })

  it('summarizes progress', () => {
    const summary = summarizeProjectTasks([
      { text: 'a', done: true, line: 1 },
      { text: 'b', done: false, line: 2 },
    ])
    expect(summary).toEqual({ total: 2, done: 1, open: 1 })
  })
})
