import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiMessage } from '../../lib/i18n/apiMessages'
import { setApiLanguage } from '../lib/apiLanguage'
import { pickApiResponseMessage } from '../lib/apiUserMessage'
import { serviceText } from '../lib/serviceI18n'
import { createPluginTranslator } from '../services/pluginI18n'
import { createTranslator } from '.'
import type { TranslationKey } from './translations'

type Case = {
  key: TranslationKey
  params?: Record<string, string | number>
  en: string | RegExp
  zh?: string | RegExp
}

/** High-traffic service/API strings — catches missing en-US keys and accidental zh in English mode. */
const SERVICE_TEXT_CASES: Case[] = [
  {
    key: 'usage.quota.exceeded',
    params: { used: 3, limit: 10 },
    en: "Today's AI quota is used up (3/10)",
    zh: '今天的 AI 请求额度已用完（3/10）',
  },
  {
    key: 'ai.error.ollamaNotRunning',
    en: /Ollama is not running/i,
    zh: /Ollama 未运行/,
  },
  {
    key: 'workspace.nameRequired',
    en: 'Name is required',
    zh: '名称不能为空',
  },
  {
    key: 'workspace.cloudSaveFailed',
    en: /Cloud save failed/i,
    zh: /云端保存失败/,
  },
  {
    key: 'workspace.autosave.project',
    en: 'Autosave project',
    zh: '自动保存项目',
  },
  {
    key: 'network.error.offline',
    en: /Cannot reach the server/i,
    zh: /无法连接服务器/,
  },
  {
    key: 'review.issue.debugLog',
    en: /Debug output/i,
    zh: /调试输出/,
  },
  {
    key: 'mention.section.title',
    en: 'Code context from @ mentions',
    zh: '用户 @ 提及的代码上下文',
  },
]

const API_SUCCESS_CASES: Array<{
  key: Parameters<typeof apiMessage>[0]
  en: string | RegExp
  zh: string | RegExp
}> = [
  { key: 'api.auth.loginOk', en: 'Signed in successfully', zh: '登录成功' },
  { key: 'api.auth.registerOk', en: 'Registration successful', zh: '注册成功' },
  { key: 'api.workspace.created', en: 'Workspace created', zh: '工作区已创建' },
  { key: 'api.workspace.deleted', en: 'Workspace deleted', zh: '工作区已删除' },
  { key: 'api.payment.simulateOk', en: /Payment simulated/i, zh: /模拟支付成功/ },
]

describe('i18n regression', () => {
  beforeEach(() => {
    setApiLanguage('en-US')
  })

  afterEach(() => {
    setApiLanguage('zh-CN')
  })

  describe('serviceText (en-US via getApiLanguage)', () => {
    it.each(SERVICE_TEXT_CASES)('$key', ({ key, params, en }) => {
      const value = serviceText(key, params)
      if (en instanceof RegExp) {
        expect(value).toMatch(en)
      } else {
        expect(value).toBe(en)
      }
      expect(value).not.toMatch(/[\u4e00-\u9fff]/)
    })
  })

  describe('serviceText (zh-CN)', () => {
    it.each(SERVICE_TEXT_CASES.filter((c) => c.zh))('$key', ({ key, params, zh }) => {
      const value = serviceText(key, params, 'zh-CN')
      if (zh instanceof RegExp) {
        expect(value).toMatch(zh)
      } else {
        expect(value).toBe(zh)
      }
    })
  })

  describe('apiMessage success keys', () => {
    it.each(API_SUCCESS_CASES)('$key en-US', ({ key, en }) => {
      expect(apiMessage(key, 'en-US')).toMatch(typeof en === 'string' ? new RegExp(en) : en)
    })

    it.each(API_SUCCESS_CASES)('$key zh-CN', ({ key, zh }) => {
      const msg = apiMessage(key, 'zh-CN')
      if (zh instanceof RegExp) {
        expect(msg).toMatch(zh)
      } else {
        expect(msg).toBe(zh)
      }
    })
  })

  describe('plugin manifest i18n', () => {
    const t = createPluginTranslator(
      {
        'en-US': { 'notify.ok': 'Plugin sandbox is working' },
        'zh-CN': { 'notify.ok': '插件沙箱运行正常' },
      },
      'en-US',
    )

    it('resolves en-US', () => {
      expect(t('notify.ok')).toBe('Plugin sandbox is working')
    })

    it('interpolates params', () => {
      const t2 = createPluginTranslator(
        { 'en-US': { 'toolbar.label': 'Files {count}' } },
        'en-US',
      )
      expect(t2('toolbar.label', { count: 2 })).toBe('Files 2')
    })
  })

  describe('pickApiResponseMessage', () => {
    const t = createTranslator('en-US')

    it('uses server message when present', () => {
      expect(
        pickApiResponseMessage(
          { message: 'Workspace saved', messageKey: 'api.workspace.saved' },
          t,
        ),
      ).toBe('Workspace saved')
    })
  })
})
