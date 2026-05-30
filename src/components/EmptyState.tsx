import React, { useMemo } from 'react'
import { FileSearch, FolderOpen, GitBranch, TerminalSquare, type LucideIcon } from 'lucide-react'
import { useI18n, type TranslationKey } from '../i18n'
import { InlineStatePanel } from './InlineStatePanel'

interface EmptyStateProps {
  type: 'files' | 'search' | 'terminal' | 'git' | 'workspace'
  onAction?: () => void
  onSecondaryAction?: () => void
}

interface ActionConfig {
  label: string
}

interface EmptyStateConfig {
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
        title: t('empty.files.title'),
        description: t('empty.files.desc'),
        primaryAction: { label: t('empty.files.new') },
        secondaryAction: { label: t('empty.files.import') },
        tips: [t('empty.files.tip1'), t('empty.files.tip2'), t('empty.files.tip3')],
      }
    case 'search':
      return {
        title: t('empty.search.title'),
        description: t('empty.search.desc'),
        tips: [t('empty.search.tip1'), t('empty.search.tip2'), t('empty.search.tip3')],
      }
    case 'terminal':
      return {
        title: t('empty.terminal.title'),
        description: t('empty.terminal.desc'),
        tips: [],
      }
    case 'git':
      return {
        title: t('empty.git.title'),
        description: t('empty.git.desc'),
        tips: [],
      }
    case 'workspace':
      return {
        title: t('empty.workspace.title'),
        description: t('empty.workspace.desc'),
        primaryAction: { label: t('empty.workspace.upload') },
        tips: [],
      }
  }
}

const typeIcon: Record<EmptyStateProps['type'], LucideIcon> = {
  files: FolderOpen,
  search: FileSearch,
  terminal: TerminalSquare,
  git: GitBranch,
  workspace: FolderOpen,
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, onSecondaryAction }) => {
  const { t } = useI18n()
  const config = useMemo(() => buildConfig(type, t), [type, t])

  return (
    <InlineStatePanel
      tone="empty"
      icon={typeIcon[type]}
      title={config.title}
      description={config.description}
      primaryAction={
        config.primaryAction && onAction
          ? { label: config.primaryAction.label, onClick: onAction }
          : undefined
      }
      secondaryAction={
        config.secondaryAction && onSecondaryAction
          ? { label: config.secondaryAction.label, onClick: onSecondaryAction, variant: 'secondary' }
          : undefined
      }
      tips={config.tips}
    />
  )
}
