import { describe, expect, it } from 'vitest'
import { parseCdpPausedLocation } from './debugCdpClient'

describe('parseCdpPausedLocation', () => {
  it('extracts file and 1-based line from call frame', () => {
    const location = parseCdpPausedLocation({
      callFrames: [{ url: 'file:///project/index.js', lineNumber: 4 }],
    })
    expect(location).toEqual({ path: 'index.js', line: 5 })
  })
})
