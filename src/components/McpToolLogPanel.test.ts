import { describe, expect, it } from 'vitest'
import { filterMcpEntries, groupMcpEntriesByServer } from './McpToolLogPanel'

const entries = [
  { serverId: 's1', serverName: 'A', tool: 'x', ok: true, output: 'ok' },
  { serverId: 's2', serverName: 'A', tool: 'y', ok: false, output: 'err' },
  { serverId: 's3', serverName: 'B', tool: 'z', ok: false, output: 'err2' },
]

describe('McpToolLogPanel helpers', () => {
  it('filters only failures', () => {
    const result = filterMcpEntries(entries, true)
    expect(result).toHaveLength(2)
    expect(result.every((entry) => !entry.ok)).toBe(true)
  })

  it('groups entries by server', () => {
    const grouped = groupMcpEntriesByServer(entries)
    expect(Object.keys(grouped)).toEqual(['A', 'B'])
    expect(grouped.A).toHaveLength(2)
    expect(grouped.B).toHaveLength(1)
  })
})
