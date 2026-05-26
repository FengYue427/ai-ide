import { describe, expect, it } from 'vitest'
import { isRunCommandBlocked } from './runCommandPolicy'

describe('runCommandPolicy', () => {
  it('allows normal dev commands', () => {
    expect(isRunCommandBlocked('npm run test')).toBeNull()
    expect(isRunCommandBlocked('git status')).toBeNull()
  })

  it('blocks destructive patterns', () => {
    expect(isRunCommandBlocked('rm -rf /')).toBe('COMMAND_BLOCKED')
    expect(isRunCommandBlocked('del /f /s /q C:\\')).toBe('COMMAND_BLOCKED')
  })
})
