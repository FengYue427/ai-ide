import { useMemo, useState, type FC } from 'react'
import { Bot, CheckSquare, ExternalLink, FilePlus2, Search } from 'lucide-react'
import { useI18n } from '../i18n'
import { useTaskFileGroups } from '../hooks/useTaskFileGroups'
import { listOpenTasksFromGroups } from '../lib/projectTasksNavigation'
import { summarizeProjectTasks } from '../services/projectTasksService'
import { InlineStatePanel } from './InlineStatePanel'

interface TasksPanelProps {
  readOnly?: boolean
  onOpenTaskFile: (path: string, line?: number) => void
  onCreateProjectTasks: () => void
  onSendOpenTasksToAgent: () => void
}

export const TasksPanel: FC<TasksPanelProps> = ({
  readOnly = false,
  onOpenTaskFile,
  onCreateProjectTasks,
  onSendOpenTasksToAgent,
}) => {
  const { t } = useI18n()
  const groups = useTaskFileGroups()
  const [query, setQuery] = useState('')

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.text.toLowerCase().includes(q) ||
            group.path.toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q),
        ),
      }))
      .filter(
        (group) =>
          group.items.length > 0 ||
          group.path.toLowerCase().includes(q) ||
          group.title.toLowerCase().includes(q),
      )
  }, [groups, query])

  const openTaskCount = listOpenTasksFromGroups(groups).length
  const hasProjectTasks = groups.some((group) => group.kind === 'project')

  if (groups.length === 0) {
    return (
      <div className="tasks-panel">
        <InlineStatePanel
          compact
          tone="hint"
          icon={CheckSquare}
          title={t('tasksPanel.emptyTitle')}
          description={t('tasksPanel.emptyDesc')}
          primaryAction={
            readOnly
              ? undefined
              : { label: t('tasks.create'), onClick: onCreateProjectTasks, variant: 'primary' }
          }
        />
      </div>
    )
  }

  return (
    <div className="tasks-panel">
      <div className="tasks-panel-toolbar">
        <div className="tasks-panel-search">
          <Search size={14} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('tasksPanel.searchPlaceholder')}
            aria-label={t('tasksPanel.searchPlaceholder')}
          />
        </div>
        <div className="tasks-panel-actions">
          {!readOnly && openTaskCount > 0 ? (
            <button type="button" className="tasks-panel-agent-btn" onClick={onSendOpenTasksToAgent}>
              <Bot size={14} />
              {t('tasksPanel.sendAgent', { count: openTaskCount })}
            </button>
          ) : null}
          {!readOnly && !hasProjectTasks ? (
            <button type="button" className="tasks-panel-link-btn" onClick={onCreateProjectTasks}>
              <FilePlus2 size={14} />
              {t('tasks.create')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="tasks-panel-groups">
        {filteredGroups.map((group) => {
          const summary = summarizeProjectTasks(group.items)
          return (
            <section key={group.path} className="tasks-panel-group">
              <header className="tasks-panel-group-header">
                <div>
                  <div className="tasks-panel-group-title">{group.title}</div>
                  <div className="tasks-panel-group-meta">
                    <span className="tasks-panel-kind">
                      {group.kind === 'spec' ? t('tasksPanel.kindSpec') : t('tasksPanel.kindProject')}
                    </span>
                    <span>{group.path}</span>
                    {group.items.length > 0 ? (
                      <span>{t('tasks.summary', { done: summary.done, total: summary.total, open: summary.open })}</span>
                    ) : (
                      <span>{t('tasksPanel.noChecklist')}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="tasks-panel-open-btn"
                  onClick={() => onOpenTaskFile(group.path, 1)}
                >
                  <ExternalLink size={12} />
                  {t('tasks.open')}
                </button>
              </header>

              {group.items.length > 0 ? (
                <ul className="tasks-panel-list">
                  {group.items.map((item) => (
                    <li key={`${group.path}-${item.line}-${item.text}`}>
                      <button
                        type="button"
                        className={`tasks-panel-item${item.done ? ' tasks-panel-item--done' : ''}`}
                        onClick={() => onOpenTaskFile(group.path, item.line)}
                      >
                        <span className="tasks-panel-checkbox" aria-hidden>
                          {item.done ? '☑' : '☐'}
                        </span>
                        <span>{item.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tasks-panel-empty-group">{t('tasksPanel.emptyGroup')}</p>
              )}
            </section>
          )
        })}
      </div>

      {filteredGroups.length === 0 ? (
        <p className="tasks-panel-no-match">{t('tasksPanel.noMatch')}</p>
      ) : null}
    </div>
  )
}
