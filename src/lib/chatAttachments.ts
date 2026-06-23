import type { AIModel } from '../services/aiService'

export type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type ChatAttachmentKind = 'image' | 'file'

export interface ChatAttachmentMeta {
  id: string
  kind: ChatAttachmentKind
  name: string
  mimeType: string
  previewDataUrl?: string
}

export interface ChatPendingAttachment extends ChatAttachmentMeta {
  size: number
  dataUrl?: string
  textContent?: string
}

export const CHAT_ATTACHMENT_MAX_COUNT = 4
export const CHAT_ATTACHMENT_MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const CHAT_ATTACHMENT_MAX_TEXT_BYTES = 32 * 1024

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.csv',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.css',
  '.html',
  '.sql',
  '.env',
  '.log',
])

const VISION_PROVIDERS = new Set<AIModel>([
  'openai',
  'deepseek',
  'google',
  'claude',
  'qwen',
  'zhipu',
  'grok',
])

export function providerSupportsChatVision(provider: AIModel): boolean {
  return VISION_PROVIDERS.has(provider)
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index).toLowerCase() : ''
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true
  return TEXT_EXTENSIONS.has(extensionOf(file.name))
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('FILE_READ_FAILED'))
    reader.readAsText(file)
  })
}

export async function parseChatAttachmentFile(file: File): Promise<ChatPendingAttachment | null> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (isImageMime(file.type)) {
    if (file.size > CHAT_ATTACHMENT_MAX_IMAGE_BYTES) return null
    const dataUrl = await readFileAsDataUrl(file)
    return {
      id,
      kind: 'image',
      name: file.name,
      mimeType: file.type || 'image/png',
      size: file.size,
      dataUrl,
      previewDataUrl: dataUrl,
    }
  }

  if (isTextLikeFile(file)) {
    if (file.size > CHAT_ATTACHMENT_MAX_TEXT_BYTES) return null
    const textContent = await readFileAsText(file)
    return {
      id,
      kind: 'file',
      name: file.name,
      mimeType: file.type || 'text/plain',
      size: file.size,
      textContent,
    }
  }

  return null
}

export function toChatAttachmentMeta(attachment: ChatPendingAttachment): ChatAttachmentMeta {
  return {
    id: attachment.id,
    kind: attachment.kind,
    name: attachment.name,
    mimeType: attachment.mimeType,
    previewDataUrl: attachment.kind === 'image' ? attachment.previewDataUrl : undefined,
  }
}

function appendTextFileSections(text: string, attachments: ChatPendingAttachment[]): string {
  let merged = text.trim()
  for (const attachment of attachments) {
    if (attachment.kind !== 'file' || !attachment.textContent) continue
    const section = `\n\n--- ${attachment.name} ---\n${attachment.textContent}`
    merged = merged ? `${merged}${section}` : section.trim()
  }
  return merged || '(see attachments)'
}

/** Build API user message content with optional vision parts. */
export function buildChatUserContent(input: {
  text: string
  attachments: ChatPendingAttachment[]
  provider: AIModel
}): string | ChatContentPart[] {
  const images = input.attachments.filter((item) => item.kind === 'image' && item.dataUrl)
  const files = input.attachments.filter((item) => item.kind === 'file')
  const mergedText = appendTextFileSections(input.text, files)

  if (images.length > 0 && providerSupportsChatVision(input.provider)) {
    const parts: ChatContentPart[] = [{ type: 'text', text: mergedText }]
    for (const image of images) {
      if (image.dataUrl) {
        parts.push({ type: 'image_url', image_url: { url: image.dataUrl } })
      }
    }
    return parts
  }

  if (images.length > 0) {
    const names = images.map((item) => item.name).join(', ')
    const hint = `[Attached images: ${names}. Switch to a vision-capable model (GPT-4o, Claude, Gemini, Qwen-VL) or describe them in text.]`
    return mergedText ? `${mergedText}\n\n${hint}` : hint
  }

  return mergedText
}

export type ChatApiMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatContentPart[]
}

export function flattenChatMessageContent(content: string | ChatContentPart[]): string {
  if (typeof content === 'string') return content
  const text = content
    .filter((part): part is Extract<ChatContentPart, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
  const imageCount = content.filter((part) => part.type === 'image_url').length
  if (imageCount <= 0) return text
  const hint = `[${imageCount} image(s) attached]`
  return text ? `${text}\n\n${hint}` : hint
}

export function toLegacyChatMessages(messages: ChatApiMessage[]): Array<{
  role: 'system' | 'user' | 'assistant'
  content: string
}> {
  return messages.map((message) => ({
    role: message.role,
    content: flattenChatMessageContent(message.content),
  }))
}
