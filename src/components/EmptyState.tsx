import React from 'react'
import { FileSearch, FolderOpen, GitBranch, Plus, TerminalSquare, Upload, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  type: 'files' | 'search' | 'terminal' | 'git' | 'workspace'
  onAction?: () => void
  onSecondaryAction?: () => void
}

interface ActionConfig {
  label: string
  icon: LucideIcon
}

interface EmptyStateConfig {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: ActionConfig
  secondaryAction?: ActionConfig
  tips: string[]
}

const configs: Record<EmptyStateProps['type'], EmptyStateConfig> = {
  files: {
    icon: FolderOpen,
    title: '这里还没有文件',
    description: '新建一个文件开始编码，或者把现有项目导入进来。',
    primaryAction: { label: '新建文件', icon: Plus },
    secondaryAction: { label: '导入文件', icon: Upload },
    tips: ['支持拖拽导入', '支持模板快速开始', '快捷键 Ctrl+N 新建文件'],
  },
  search: {
    icon: FileSearch,
    title: '开始搜索项目内容',
    description: '输入关键词，在当前项目中查找文件名或代码片段。',
    tips: ['支持全局搜索', '支持替换', '快捷键 Ctrl+Shift+F 打开'],
  },
  terminal: {
    icon: TerminalSquare,
    title: '终端已准备好',
    description: '可以直接运行 Node.js 命令，或在这里观察项目输出。',
    tips: ['尝试 npm install', '尝试 npm run dev', '支持常用 shell 命令'],
  },
  git: {
    icon: GitBranch,
    title: 'Git 面板等待项目接入',
    description: '打开仓库后，这里会显示变更、提交和版本操作。',
    tips: ['适合查看当前变更', '后续可扩展协作流程', '与工作区上下文联动'],
  },
  workspace: {
    icon: FolderOpen,
    title: '工作区还是空的',
    description: '上传项目文件夹，让 AI 和编辑器一起理解完整上下文。',
    primaryAction: { label: '上传文件夹', icon: Upload },
    tips: ['支持拖拽上传', '适合导入多文件项目', '导入后可直接搜索和运行'],
  },
} as const

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, onSecondaryAction }) => {
  const config = configs[type]
  const Icon = config.icon

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        minHeight: '240px',
        padding: '28px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 20%, transparent), transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-color) 30%, var(--border-color))',
          color: 'var(--accent-color)',
        }}
      >
        <Icon size={28} />
      </div>

      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          {config.title}
        </h3>
        <p
          style={{
            maxWidth: '280px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}
        >
          {config.description}
        </p>
      </div>

      {(config.primaryAction || config.secondaryAction) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {config.primaryAction && onAction && (
            <button
              onClick={onAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent-color)',
                color: 'var(--bg-primary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <config.primaryAction.icon size={14} />
              {config.primaryAction.label}
            </button>
          )}

          {config.secondaryAction && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <config.secondaryAction.icon size={14} />
              {config.secondaryAction.label}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: '6px' }}>
        {config.tips.map((tip) => (
          <div key={tip} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {tip}
          </div>
        ))}
      </div>
    </div>
  )
}
