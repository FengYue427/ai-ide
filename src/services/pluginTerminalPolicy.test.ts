import { describe, expect, it } from 'vitest'
import { isTerminalCommandAllowed } from './pluginTerminalPolicy'

describe('pluginTerminalPolicy', () => {
  it('allows safe read-only commands', () => {
    expect(isTerminalCommandAllowed('echo hello', 'safe')).toBe(true)
    expect(isTerminalCommandAllowed('git status', 'safe')).toBe(true)
  })

  it('blocks shell chaining in safe mode', () => {
    expect(isTerminalCommandAllowed('echo hi && rm -rf /', 'safe')).toBe(false)
    expect(isTerminalCommandAllowed('ls; cat /etc/passwd', 'safe')).toBe(false)
  })

  it('blocks unknown commands in safe mode', () => {
    expect(isTerminalCommandAllowed('curl https://evil.test', 'safe')).toBe(false)
  })

  it('blocks npx and node eval in safe mode', () => {
    expect(isTerminalCommandAllowed('npx eslint .', 'safe')).toBe(false)
    expect(isTerminalCommandAllowed('node -e "process.exit(1)"', 'safe')).toBe(false)
  })

  it('blocks npm scripts outside allowlist in safe mode', () => {
    expect(isTerminalCommandAllowed('npm publish', 'safe')).toBe(false)
    expect(isTerminalCommandAllowed('npm test', 'safe')).toBe(true)
  })

  it('allows any command in full mode', () => {
    expect(isTerminalCommandAllowed('curl https://example.com', 'full')).toBe(true)
  })
})
