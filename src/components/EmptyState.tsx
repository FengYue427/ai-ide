import React from 'react'
import { FolderOpen, Plus, Upload, FileText } from 'lucide-react'

interface EmptyStateProps {
  type: 'files' | 'search' | 'terminal' | 'git' | 'workspace'
  onAction?: () => void
  onSecondaryAction?: () => void
}

/**
 * 空状态组件 - 提升用户体验的引导式空状态
 * 
 * 设计理念：
 * 1. 视觉友好：使用渐变色和图标，消除空白的尴尬感
 * 2. 行动导向：明确告诉用户下一步可以做什么
 * 3. 上下文感知：根据场景提供不同的文案和按钮
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  onAction, 
  onSecondaryAction 
}) => {
  const configs = {
    files: {
      icon: FolderOpen,
      title: '还没有文件',
      description: '创建一个新文件或导入现有项目开始编码',
      primaryAction: { label: '新建文件', icon: Plus },
      secondaryAction: { label: '导入文件', icon: Upload },
      tips: [
        '💡 拖拽文件到此处快速导入',
        '💡 使用模板快速开始',
        '💡 快捷键 Ctrl+N 新建文件'
      ]
    },
    search: {
      icon: FileText,
      title: '开始搜索',
      description: '输入关键词搜索项目中的文件和内容',
      primaryAction: null,
      secondaryAction: null,
      tips: [
        '💡 支持正则表达式搜索',
        '💡 使用 " 精确匹配',
        '💡 Ctrl+Shift+F 快速打开'
      ]
    },
    terminal: {
      icon: FileText,
      title: '终端已就绪',
      description: 'WebContainer 环境已启动，可以运行 Node.js 命令',
      primaryAction: null,
      secondaryAction: null,
      tips: [
        '💡 输入 npm install 安装依赖',
        '💡 输入 npm start 运行项目',
        '💡 支持常用 Linux 命令'
      ]
    },
    git: {
      icon: FileText,
      title: 'Git 面板',
      description: '版本控制功能正在完善中',
      primaryAction: null,
      secondaryAction: null,
      tips: [
        '💡 即将支持 Git 初始化',
        '💡 即将支持提交历史查看',
        '💡 即将支持分支管理'
      ]
    },
    workspace: {
      icon: FolderOpen,
      title: '工作区为空',
      description: '上传项目文件夹，让 AI 理解完整上下文',
      primaryAction: { label: '上传文件夹', icon: Upload },
      secondaryAction: null,
      tips: [
        '💡 支持拖拽上传',
        '💡 AI 会分析整个项目结构',
        '💡 可以选择特定文件让 AI 关注'
      ]
    }
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        minHeight: '200px',
      }}
    >
      {/* 图标容器 */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent-color)20 0%, var(--accent-color)05 100%)',
          border: '2px solid var(--accent-color)30',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
        }}
      >
        <Icon 
          size={28} 
          style={{ 
            color: 'var(--accent-color)',
            filter: 'drop-shadow(0 2px 8px var(--accent-color)40)'
          }} 
        />
      </div>

      {/* 标题 */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}
      >
        {config.title}
      </h3>

      {/* 描述 */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          maxWidth: '240px',
          marginBottom: '20px',
        }}
      >
        {config.description}
      </p>

      {/* 操作按钮 */}
      {(config.primaryAction || config.secondaryAction) && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
          }}
        >
          {config.primaryAction && onAction && (
            <button
              onClick={onAction}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'var(--accent-color)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
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
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)'
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
            >
              <config.secondaryAction.icon size={14} />
              {config.secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* 提示列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          alignItems: 'flex-start',
        }}
      >
        {config.tips.map((tip, idx) => (
          <div
            key={idx}
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              opacity: 0.7 - idx * 0.15,
              transition: 'opacity 0.3s ease',
            }}
          >
            {tip}
          </div>
        ))}
      </div>
    </div>
  )
}

export default EmptyState
