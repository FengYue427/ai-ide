import React from 'react'
import { Activity, AlertCircle, Bot, CheckCircle2, CircleDot, Globe, Save, Settings2, Shield, Sparkles, Zap } from 'lucide-react'
import { useI18n } from '../i18n'
import { normalizeLanguage } from '../lib/language'

interface StatusBarProps {
  currentFileName: string
  currentFileLanguage: string
  lineCount: number
  charCount: number
  diagnosticCount?: number
  isModified?: boolean
  isWebContainerReady: boolean
  gitBranch?: string
  gitModified?: number
  aiProvider?: string
  isAIConnected?: boolean
  autoSaveEnabled: boolean
  language: string
  activeFeatures?: {
    codeReview?: boolean
    performance?: boolean
    snippets?: boolean
  }
  onOpenGitPanel?: () => void
  onOpenAISettings?: () => void
  onToggleAutoSave?: () => void
  onOpenSettings?: () => void
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 10px',
  borderRadius: '999px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-tertiary) 88%, transparent)',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  fontWeight: 700,
  minHeight: '26px',
}

const actionButtonStyle: React.CSSProperties = {
  ...pillStyle,
  background: 'transparent',
  cursor: 'pointer',
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentFileName,
  currentFileLanguage,
  lineCount,
  charCount,
  diagnosticCount = 0,
  isModified = false,
  isWebContainerReady,
  gitBranch,
  gitModified = 0,
  aiProvider,
  isAIConnected = false,
  autoSaveEnabled,
  language,
  activeFeatures = {},
  onOpenGitPanel,
  onOpenAISettings,
  onToggleAutoSave,
  onOpenSettings,
}) => {
  const { t } = useI18n()
  const uiLocale = normalizeLanguage(language)
  const getLanguageLabel = () => {
    const map: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      markdown: 'Markdown',
      plaintext: 'Plain Text',
    }
    return map[currentFileLanguage] ?? currentFileLanguage
  }

  return (
    <div
      style={{
        minHeight: '36px',
        borderTop: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--bg-secondary) 92%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '6px 12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ ...pillStyle, color: 'var(--text-primary)', background: 'transparent' }}>
          {isModified ? <CircleDot size={12} color="var(--warning-color)" /> : <CheckCircle2 size={12} color="var(--success-color)" />}
          <span>{currentFileName}</span>
        </div>

        <div style={pillStyle}>
          <Sparkles size={12} />
          <span>{getLanguageLabel()}</span>
        </div>

        <div style={pillStyle}>
          <span>{t('editor.meta.lines', { count: lineCount })}</span>
          <span>·</span>
          <span>{t('editor.meta.chars', { count: charCount })}</span>
        </div>

        <div style={{ ...pillStyle, color: diagnosticCount > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
          <AlertCircle size={12} />
          <span>
            {diagnosticCount > 0
              ? t('status.diagnostics.count', { count: diagnosticCount })
              : t('status.diagnostics.none')}
          </span>
        </div>

        {activeFeatures.codeReview && (
          <div style={{ ...pillStyle, color: '#60a5fa' }}>
            <Shield size={12} />
            <span>{t('status.feature.review')}</span>
          </div>
        )}
        {activeFeatures.performance && (
          <div style={{ ...pillStyle, color: 'var(--success-color)' }}>
            <Activity size={12} />
            <span>{t('status.feature.performance')}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ ...pillStyle, color: isWebContainerReady ? 'var(--success-color)' : 'var(--warning-color)' }}>
          <Zap size={12} />
          <span>{isWebContainerReady ? t('status.runtime.ready') : t('status.runtime.loading')}</span>
        </div>

        <button onClick={onToggleAutoSave} style={{ ...actionButtonStyle, color: autoSaveEnabled ? 'var(--success-color)' : 'var(--text-secondary)' }} title={t('status.autosaveTitle')}>
          <Save size={12} />
          <span>{autoSaveEnabled ? t('status.autosave.on') : t('status.autosave.off')}</span>
        </button>

        {gitBranch && (
          <button onClick={onOpenGitPanel} style={{ ...actionButtonStyle, color: gitModified > 0 ? 'var(--warning-color)' : 'var(--text-secondary)' }} title={t('status.gitTitle')}>
            <span>{gitBranch}</span>
            {gitModified > 0 && <span>({gitModified})</span>}
          </button>
        )}

        <button onClick={onOpenAISettings} style={{ ...actionButtonStyle, color: isAIConnected ? 'var(--accent-color)' : 'var(--text-secondary)' }} title={t('status.aiTitle')}>
          <Bot size={12} />
          <span>{isAIConnected ? aiProvider ?? t('status.ai.connected') : t('status.ai.configure')}</span>
          {isAIConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
        </button>

        <div style={pillStyle}>
          <Globe size={12} />
          <span>{uiLocale === 'en-US' ? t('status.locale.en') : t('status.locale.zh')}</span>
        </div>

        <button onClick={onOpenSettings} style={actionButtonStyle} title={t('status.settingsTitle')}>
          <Settings2 size={12} />
          <span>{t('status.settings')}</span>
        </button>
      </div>
    </div>
  )
}

export default StatusBar
