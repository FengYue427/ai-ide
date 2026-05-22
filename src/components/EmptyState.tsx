import React, { useMemo } from 'react'
import { FileSearch, FolderOpen, GitBranch, Plus, TerminalSquare, Upload, type LucideIcon } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'

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

function buildConfig(type: EmptyStateProps['type'], t: (key: TranslationKey) => string): EmptyStateConfig {
  switch (type) {
    case 'files':
      return {
        icon: FolderOpen,
        title: t('empty.files.title'),
        description: t('empty.files.desc'),
        primaryAction: { label: t('empty.files.new'), icon: Plus },
        secondaryAction: { label: t('empty.files.import'), icon: Upload },
        tips: [t('empty.files.tip1'), t('empty.files.tip2'), t('empty.files.tip3')],
      }
    case 'search':
      return {
        icon: FileSearch,
        title: t('empty.search.title'),
        description: t('empty.search.desc'),
        tips: [t('empty.search.tip1'), t('empty.search.tip2'), t('empty.search.tip3')],
      }
    case 'terminal':
      return {
        icon: TerminalSquare,
        title: t('empty.terminal.title'),
        description: t('empty.terminal.desc'),
        tips: [],
      }
    case 'git':
      return {
        icon: GitBranch,
        title: t('empty.git.title'),
        description: t('empty.git.desc'),
        tips: [],
      }
    case 'workspace':
      return {
        icon: FolderOpen,
        title: t('empty.workspace.title'),
        description: t('empty.workspace.desc'),
        primaryAction: { label: t('empty.workspace.upload'), icon: Upload },
        tips: [],
      }
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, onSecondaryAction }) => {
  const { t } = useI18n()
  const config = useMemo(() => buildConfig(type, t), [type, t])
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
          borderRadius: '20px',
          background: 'color-mix(in srgb, var(--accent-color) 14%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={28} color="var(--accent-color)" />
      </div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{config.title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px' }}>
          {config.description}
        </div>
      </div>
      {(config.primaryAction || config.secondaryAction) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {config.primaryAction && onAction && (
            <button type="button" className="btn btn-primary" onClick={onAction}>
              <config.primaryAction.icon size={14} style={{ marginRight: '6px' }} />
              {config.primaryAction.label}
            </button>
          )}
          {config.secondaryAction && onSecondaryAction && (
            <button type="button" className="btn btn-secondary" onClick={onSecondaryAction}>
              <config.secondaryAction.icon size={14} style={{ marginRight: '6px' }} />
              {config.secondaryAction.label}
            </button>
          )}
        </div>
      )}
      {config.tips.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
          }}
        >
          {config.tips.map((tip) => (
            <li key={tip}>· {tip}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
