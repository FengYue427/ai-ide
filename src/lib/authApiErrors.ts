import type { TranslateFn, TranslationKey } from '../i18n'

const AUTH_API_ERROR_MAP: Record<string, TranslationKey> = {
  '邮箱和密码必填': 'auth.api.required',
  '邮箱或密码错误': 'auth.error.loginFailed',
  '登录失败，请稍后重试': 'auth.error.loginFailed',
  '请输入有效的邮箱地址': 'auth.error.invalidEmail',
  '密码至少需要8位': 'auth.error.passwordLength',
  '密码至少需要 8 位': 'auth.error.passwordLength',
  '邮箱已注册': 'auth.api.emailTaken',
  '注册失败': 'auth.error.registerFailed',
  '注册失败，请稍后重试': 'auth.error.registerFailed',
  '邮箱必填': 'auth.api.emailRequired',
  '发送失败': 'auth.error.resetFailed',
  'OAuth 登录同步失败': 'auth.api.oauthSyncFailed',
  'OAuth 会话无效，请重新登录': 'auth.api.oauthSessionInvalid',
  '未找到 OAuth 用户，请重试': 'auth.api.oauthUserMissing',
  'OAuth 同步失败': 'auth.api.oauthSyncFailed',
}

export function localizeAuthApiError(message: string | undefined, t: TranslateFn): string | undefined {
  if (!message?.trim()) return undefined
  const key = AUTH_API_ERROR_MAP[message.trim()]
  return key ? t(key) : message
}
