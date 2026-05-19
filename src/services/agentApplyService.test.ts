import { describe, expect, it } from 'vitest'
import { parseAgentFileChanges } from './agentApplyService'

describe('agentApplyService', () => {
  it('parses ### heading and code block', () => {
    const md = `Plan done.

### src/foo.ts
\`\`\`typescript
export const x = 1
\`\`\`
`
    const changes = parseAgentFileChanges(md)
    expect(changes).toHaveLength(1)
    expect(changes[0].path).toBe('src/foo.ts')
    expect(changes[0].content).toContain('export const x')
  })
})
