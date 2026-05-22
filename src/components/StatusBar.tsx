import React from 'react'
import { Activity, AlertCircle, Bot, CheckCircle2, CircleDot, Globe, Save, Settings2, Shield, Sparkles, Zap } from 'lucide-react'

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
          <span>{lineCount} 行</span>
          <span>·</span>
          <span>{charCount} 字符</span>
        </div>

        <div style={{ ...pillStyle, color: diagnosticCount > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>
          <AlertCircle size={12} />
          <span>{diagnosticCount > 0 ? `${diagnosticCount} 个诊断` : '无诊断'}</span>
        </div>

        {activeFeatures.codeReview && (
          <div style={{ ...pillStyle, color: '#60a5fa' }}>
            <Shield size={12} />
            <span>代码审查</span>
          </div>
        )}
        {activeFeatures.performance && (
          <div style={{ ...pillStyle, color: 'var(--success-color)' }}>
            <Activity size={12} />
            <span>性能监测</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ ...pillStyle, color: isWebContainerReady ? 'var(--success-color)' : 'var(--warning-color)' }}>
          <Zap size={12} />
          <span>{isWebContainerReady ? '运行环境已就绪' : '运行环境加载中'}</span>
        </div>

        <button onClick={onToggleAutoSave} style={{ ...actionButtonStyle, color: autoSaveEnabled ? 'var(--success-color)' : 'var(--text-secondary)' }} title="切换自动保存">
          <Save size={12} />
          <span>{autoSaveEnabled ? '自动保存开启' : '手动保存'}</span>
        </button>

        {gitBranch && (
          <button onClick={onOpenGitPanel} style={{ ...actionButtonStyle, color: gitModified > 0 ? 'var(--warning-color)' : 'var(--text-secondary)' }} title="打开 Git 面板">
            <span>{gitBranch}</span>
            {gitModified > 0 && <span>({gitModified})</span>}
          </button>
        )}

        <button onClick={onOpenAISettings} style={{ ...actionButtonStyle, color: isAIConnected ? 'var(--accent-color)' : 'var(--text-secondary)' }} title="配置 AI">
          <Bot size={12} />
          <span>{isAIConnected ? aiProvider ?? 'AI 已连接' : '配置 AI'}</span>
          {isAIConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
        </button>

        <div style={pillStyle}>
          <Globe size={12} />
          <span>{language === 'en' || language === 'en-US' ? 'English' : '中文'}</span>
        </div>

        <button onClick={onOpenSettings} style={actionButtonStyle} title="打开设置">
          <Settings2 size={12} />
          <span>设置</span>
        </button>
      </div>
    </div>
  )
}

export default StatusBar
