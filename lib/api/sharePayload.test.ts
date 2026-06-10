import { describe, expect, it } from 'vitest'
import { validateSharePayload } from './sharePayload'

describe('validateSharePayload', () => {
  it('accepts a small file list', () => {
    const result = validateSharePayload([{ name: 'src/app.ts', content: 'console.log(1)', language: 'typescript' }])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.files).toHaveLength(1)
      expect(result.files[0]?.name).toBe('src/app.ts')
    }
  })

  it('rejects empty payload', () => {
    const result = validateSharePayload([])
    expect(result.ok).toBe(false)
  })

  it('rejects invalid file entries', () => {
    const result = validateSharePayload([{ name: '', content: 'x' }])
    expect(result.ok).toBe(false)
  })
})
