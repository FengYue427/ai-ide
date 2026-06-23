import { describe, expect, it } from 'vitest'
import {
  buildChatUserContent,
  providerSupportsChatVision,
  toChatAttachmentMeta,
  type ChatPendingAttachment,
} from './chatAttachments'

describe('chatAttachments', () => {
  const imageAttachment: ChatPendingAttachment = {
    id: '1',
    kind: 'image',
    name: 'shot.png',
    mimeType: 'image/png',
    size: 1200,
    dataUrl: 'data:image/png;base64,abc',
    previewDataUrl: 'data:image/png;base64,abc',
  }

  const fileAttachment: ChatPendingAttachment = {
    id: '2',
    kind: 'file',
    name: 'notes.md',
    mimeType: 'text/markdown',
    size: 32,
    textContent: '# todo',
  }

  it('detects vision providers', () => {
    expect(providerSupportsChatVision('openai')).toBe(true)
    expect(providerSupportsChatVision('ollama')).toBe(false)
  })

  it('builds multimodal content for vision providers', () => {
    const content = buildChatUserContent({
      text: 'explain this',
      attachments: [imageAttachment],
      provider: 'openai',
    })
    expect(Array.isArray(content)).toBe(true)
    expect(content).toHaveLength(2)
  })

  it('falls back to text hint for non-vision providers', () => {
    const content = buildChatUserContent({
      text: '',
      attachments: [imageAttachment],
      provider: 'ollama',
    })
    expect(typeof content).toBe('string')
    expect(content).toContain('Attached images')
  })

  it('merges text file attachments into prompt', () => {
    const content = buildChatUserContent({
      text: 'review',
      attachments: [fileAttachment],
      provider: 'deepseek',
    })
    expect(content).toContain('notes.md')
    expect(content).toContain('# todo')
  })

  it('serializes attachment meta without heavy payload', () => {
    const meta = toChatAttachmentMeta(imageAttachment)
    expect(meta.name).toBe('shot.png')
    expect(meta.previewDataUrl).toBeTruthy()
  })
})
