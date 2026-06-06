import { describe, expect, it, vi } from 'vitest'
import {
  parseAcceptanceMarkdown,
  verifyAcceptance,
  verifyAcceptanceAsync,
} from './acceptanceRunner'

const SAMPLE = `# Acceptance

- [ ] Login works
- [x] Logout works

\`\`\`aide-acceptance
- npm run test:unit
echo ok
\`\`\`
`

describe('acceptanceRunner', () => {
  it('parses unchecked items and aide-acceptance blocks', () => {
    const parsed = parseAcceptanceMarkdown(SAMPLE)
    expect(parsed.uncheckedItems).toEqual(['Login works'])
    expect(parsed.commandBlocks[0]?.commands).toEqual(['npm run test:unit', 'echo ok'])
  })

  it('fails when unchecked items remain', () => {
    const result = verifyAcceptance(SAMPLE, { isDesktop: false })
    expect(result.ok).toBe(false)
    expect(result.failures.some((row) => row.startsWith('unchecked:'))).toBe(true)
    expect(result.commandResults.every((row) => row.status === 'skip')).toBe(true)
  })

  it('runs commands on desktop', async () => {
    const runCommand = vi.fn(async () => ({ exitCode: 0 }))
    const content = `- [x] done

\`\`\`aide-acceptance
- npm run test:unit
\`\`\`
`
    const result = await verifyAcceptanceAsync(content, { isDesktop: true, runCommand })
    expect(result.ok).toBe(true)
    expect(runCommand).toHaveBeenCalledWith('npm run test:unit')
  })
})
