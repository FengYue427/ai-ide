import { afterEach, describe, expect, it } from 'vitest'
import { registerTerminalBridge } from './terminalBridge'
import { buildTerminalContextSection } from './terminalContextService'

describe('terminalContextService', () => {
  afterEach(() => {
    registerTerminalBridge(null)
  })

  it('returns empty when terminal has no output', () => {
    registerTerminalBridge(null, () => [])
    expect(buildTerminalContextSection(20, 'zh-CN')).toBe('')
  })

  it('includes last lines in zh section', () => {
    registerTerminalBridge(null, () => ['line-a', 'line-b', 'line-c'])
    const section = buildTerminalContextSection(2, 'zh-CN')
    expect(section).toContain('终端最近输出')
    expect(section).toContain('line-b')
    expect(section).toContain('line-c')
    expect(section).not.toContain('line-a')
  })
})
