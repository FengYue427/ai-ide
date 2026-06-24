import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isPtyDisabledByEnv } from '../electron/ptyBridge.mjs'

describe('electron PTY packaging', () => {
  it('bundles node-pty in desktop builder configs', () => {
    for (const file of ['electron-builder.yml', 'electron-builder.offline.yml']) {
      const text = readFileSync(join(process.cwd(), file), 'utf8')
      expect(text).toContain('node_modules/node-pty')
      expect(text).toContain('electron/preload.mjs')
      expect(text).toContain('asarUnpack')
      expect(text).toContain('npmRebuild: false')
    }
  })

  it('disables PTY only when AI_IDE_PTY=0', () => {
    expect(isPtyDisabledByEnv({})).toBe(false)
    expect(isPtyDisabledByEnv({ AI_IDE_PTY: '1' })).toBe(false)
    expect(isPtyDisabledByEnv({ AI_IDE_PTY: '0' })).toBe(true)
  })
})
