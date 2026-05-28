import type { TranslationKey } from '../i18n'
import { isPayloadTooLargeError } from './workspaceLimits'

export type ChatErrorKind =
  | 'aborted'
  | 'network'
  | 'unauthorized'
  | 'quota'
  | 'payload'
  | 'generic'

export type ChatErrorPresentation = {
  kind: ChatErrorKind
  titleKey: TranslationKey
  bodyKey: TranslationKey
  hintKey: TranslationKey
}

export function classifyChatError(message: string): ChatErrorKind {
  const lower = message.toLowerCase()

  if (lower.includes('aborted') || lower.includes('中止') || lower.includes('取消')) {
    return 'aborted'
  }
  if (isPayloadTooLargeError(message)) {
    return 'payload'
  }
  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('配额') ||
    lower.includes('rate limit') ||
    lower.includes('too many')
  ) {
    return 'quota'
  }
  if (
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('api key') ||
    lower.includes('认证')
  ) {
    return 'unauthorized'
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused') ||
    lower.includes('timeout') ||
    lower.includes('网络') ||
    lower.includes('连接')
  ) {
    return 'network'
  }

  return 'generic'
}

export function getChatErrorPresentation(kind: ChatErrorKind): ChatErrorPresentation {
  switch (kind) {
    case 'aborted':
      return {
        kind,
        titleKey: 'chat.error.abortedTitle',
        bodyKey: 'chat.error.abortedBody',
        hintKey: 'chat.error.abortedHint',
      }
    case 'network':
      return {
        kind,
        titleKey: 'chat.error.networkTitle',
        bodyKey: 'chat.error.networkBody',
        hintKey: 'chat.error.networkHint',
      }
    case 'unauthorized':
      return {
        kind,
        titleKey: 'chat.error.authTitle',
        bodyKey: 'chat.error.authBody',
        hintKey: 'chat.error.authHint',
      }
    case 'quota':
      return {
        kind,
        titleKey: 'chat.error.quotaTitle',
        bodyKey: 'chat.error.quotaBody',
        hintKey: 'chat.error.quotaHint',
      }
    case 'payload':
      return {
        kind,
        titleKey: 'chat.error.payloadTooLarge',
        bodyKey: 'chat.error.payloadTooLarge',
        hintKey: 'chat.error.payloadTooLargeTips',
      }
    default:
      return {
        kind: 'generic',
        titleKey: 'chat.error.genericTitle',
        bodyKey: 'chat.error.genericBody',
        hintKey: 'chat.error.genericHint',
      }
  }
}

export function formatChatErrorMessage(
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
  rawMessage: string,
  params?: Record<string, string | number>,
): { kind: ChatErrorKind; content: string } {
  const kind = classifyChatError(rawMessage)
  const presentation = getChatErrorPresentation(kind)
  const title = t(presentation.titleKey, params)
  const body =
    kind === 'generic' && rawMessage
      ? t(presentation.bodyKey, { message: rawMessage, ...params })
      : kind === 'payload'
        ? ''
        : t(presentation.bodyKey, params)
  const hint = t(presentation.hintKey, params)
  const parts = [title, body, hint].filter(Boolean)
  return {
    kind,
    content: parts.join('\n\n'),
  }
}
