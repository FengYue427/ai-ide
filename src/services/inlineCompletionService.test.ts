import { describe, expect, it } from 'vitest'
import { inlineCompletionService } from './inlineCompletionService'

describe('inlineCompletionService', () => {
  it('returns null without api key for cloud providers', async () => {
    const result = await inlineCompletionService.fetchCompletion({
      prefix: 'const x = ',
      suffix: '',
      language: 'javascript',
      filename: 'app.js',
      config: { provider: 'openai', apiKey: '' },
    })
    expect(result).toBeNull()
  })
})
