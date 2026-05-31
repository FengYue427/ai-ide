import { describe, expect, it } from 'vitest'
import { parseGitPorcelainZ } from './parseGitPorcelain'

describe('parseGitPorcelainZ', () => {
  it('parses untracked and modified entries', () => {
    const raw = ' M src/app.ts\0?? README.md\0'
    expect(parseGitPorcelainZ(raw)).toEqual([
      { filepath: 'src/app.ts', staged: false, status: 'modified' },
      { filepath: 'README.md', staged: false, status: 'untracked' },
    ])
  })

  it('parses staged and dual-status rows', () => {
    const raw = 'M  staged.js\0MM both.js\0'
    expect(parseGitPorcelainZ(raw)).toEqual([
      { filepath: 'staged.js', staged: true, status: 'modified' },
      { filepath: 'both.js', staged: true, status: 'modified' },
      { filepath: 'both.js', staged: false, status: 'modified' },
    ])
  })

  it('parses rename target path', () => {
    const raw = 'R  old.ts\0new.ts\0'
    expect(parseGitPorcelainZ(raw)).toEqual([
      { filepath: 'new.ts', staged: true, status: 'modified' },
    ])
  })
})
