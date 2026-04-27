import React from 'react'
import { GitBranch, AlertCircle, CheckCircle, Circle, Zap, Save, Globe, Bot, Activity, Shield, Code2 } from 'lucide-react'

interface StatusBarProps {
  // 文件信息
  currentFileName: string
  currentFileLanguage: string
  lineCount: number
  charCount: number
  isModified?: boolean

  // WebContainer 状态
  isWebContainerReady: boolean

  // Git 信息
  gitBranch?: string
  gitModified?: number

  // AI 状态
  aiProvider?: string
  isAIConnected?: boolean

  // 功能状态
  autoSaveEnabled: boolean
  language: string

  // 活动指示器
  activeFeatures?: {
    codeReview?: boolean
    performance?: boolean
    snippets?: boolean
  }

  // 点击回调
  onOpenGitPanel?: () => void
  onOpenAISettings?: () => void
  onToggleAutoSave?: () => void
  onOpenSettings?: () => void
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentFileName,
  currentFileLanguage,
  lineCount,
  charCount,
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
  onOpenSettings
}) => {
  const getLanguageIcon = () => {
    switch (currentFileLanguage) {
      case 'javascript':
      case 'typescript':
        return 'JS'
      case 'python':
        return 'PY'
      case 'html':
        return 'HTML'
      case 'css':
        return 'CSS'
      case 'json':
        return 'JSON'
      case 'markdown':
        return 'MD'
      default:
        return currentFileLanguage.toUpperCase().slice(0, 4)
    }
  }

  return (
    <div
      style={{
        height: '28px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '12px',
        userSelect: 'none'
      }}
    >
      {/* Left Section - File Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* File Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isModified && (
            <Circle size={8} fill="var(--accent-color)" style={{ color: 'var(--accent-color)' }} />
          )}
          <span style={{ fontWeight: 500 }}>{currentFileName}</span>
          {isModified && <span style={{ opacity: 0.6 }}>(已修改)</span>}
        </div>

        {/* Language */}
        <div
          style={{
            padding: '2px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {getLanguageIcon()}
        </div>

        {/* Line/Char Count */}
        <div style={{ opacity: 0.7, display: 'flex', gap: '12px' }}>
          <span>{lineCount} 行</span>
          <span>{charCount} 字符</span>
        </div>
      </div>

      {/* Center Section - Active Features */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {activeFeatures.codeReview && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: '#3b82f620',
              borderRadius: '4px',
              color: '#3b82f6'
            }}
            title="代码审查已启用"
          >
            <Shield size={12} />
            <span style={{ fontSize: '11px' }}>审查</span>
          </div>
        )}
        {activeFeatures.performance && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: '#10b98120',
              borderRadius: '4px',
              color: '#10b981'
            }}
            title="性能分析已启用"
          >
            <Activity size={12} />
            <span style={{ fontSize: '11px' }}>性能</span>
          </div>
        )}
        {activeFeatures.snippets && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: '#f59e0b20',
              borderRadius: '4px',
              color: '#f59e0b'
            }}
            title="代码片段已启用"
          >
            <Code2 size={12} />
            <span style={{ fontSize: '11px' }}>片段</span>
          </div>
        )}
      </div>

      {/* Right Section - System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* WebContainer Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isWebContainerReady ? '#10b981' : '#f59e0b'
          }}
          title={isWebContainerReady ? 'WebContainer 就绪' : 'WebContainer 加载中...'}
        >
          <Zap size={12} />
          <span style={{ fontSize: '11px' }}>
            {isWebContainerReady ? '就绪' : '加载中'}
          </span>
        </div>

        {/* Auto Save */}
        <button
          onClick={onToggleAutoSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            background: autoSaveEnabled ? '#10b98120' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: autoSaveEnabled ? '#10b981' : 'var(--text-secondary)',
            fontSize: '11px'
          }}
          title={autoSaveEnabled ? '自动保存已启用' : '自动保存已禁用'}
        >
          <Save size={12} />
          <span>{autoSaveEnabled ? '自动保存' : '手动保存'}</span>
        </button>

        {/* Git Status */}
        {gitBranch && (
          <button
            onClick={onOpenGitPanel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              background: gitModified > 0 ? '#f59e0b20' : 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: gitModified > 0 ? '#f59e0b' : 'var(--text-secondary)',
              fontSize: '11px'
            }}
          >
            <GitBranch size={12} />
            <span>{gitBranch}</span>
            {gitModified > 0 && (
              <span style={{ marginLeft: '4px' }}>({gitModified})</span>
            )}
          </button>
        )}

        {/* AI Status */}
        <button
          onClick={onOpenAISettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            background: isAIConnected ? '#3b82f620' : 'var(--bg-tertiary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: isAIConnected ? '#3b82f6' : 'var(--text-secondary)',
            fontSize: '11px'
          }}
          title={isAIConnected ? `AI 已连接 (${aiProvider})` : 'AI 未配置'}
        >
          <Bot size={12} />
          <span>{isAIConnected ? aiProvider : 'AI'}</span>
          {isAIConnected ? (
            <CheckCircle size={10} />
          ) : (
            <AlertCircle size={10} />
          )}
        </button>

        {/* Language */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            background: 'var(--bg-tertiary)',
            borderRadius: '4px',
            fontSize: '11px'
          }}
        >
          <Globe size={12} />
          <span>{language === 'zh' ? '中文' : 'EN'}</span>
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          style={{
            padding: '4px',
            background: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center'
          }}
          title="打开设置"
        >
          <Activity size={14} />
        </button>
      </div>
    </div>
  )
}

export default StatusBar
