import { describe, expect, it } from 'vitest'
import { parseDebugCallStack } from './debugCallStack'

describe('parseDebugCallStack', () => {
  it('parses nested call frames with local scope ids', () => {
    const frames = parseDebugCallStack({
      callFrames: [
        {
          callFrameId: 'f0',
          functionName: 'inner',
          url: 'file:///project/app.js',
          lineNumber: 9,
          columnNumber: 2,
          scopeChain: [{ type: 'local', object: { objectId: 'scope-inner' } }],
        },
        {
          callFrameId: 'f1',
          functionName: 'outer',
          url: 'file:///project/app.js',
          lineNumber: 3,
          columnNumber: 0,
          scopeChain: [{ type: 'local', object: { objectId: 'scope-outer' } }],
        },
      ],
    })

    expect(frames).toHaveLength(2)
    expect(frames[0]?.functionName).toBe('inner')
    expect(frames[0]?.line).toBe(10)
    expect(frames[0]?.localScopeObjectId).toBe('scope-inner')
    expect(frames[1]?.line).toBe(4)
  })
})
