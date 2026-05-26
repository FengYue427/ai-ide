import { CheckSquare } from 'lucide-react'
import { useI18n } from '../i18n'
import type { ProjectTaskItem } from '../services/projectTasksService'
import { summarizeProjectTasks } from '../services/projectTasksService'

const cardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  background: 'color-mix(in srgb, var(--bg-secondary) 88%, transparent)',
}

interface ProjectTasksSectionProps {
  tasks: ProjectTaskItem[]
  onEditTasks: () => void
}

export function ProjectTasksSection({ tasks, onEditTasks }: ProjectTasksSectionProps) {
  const { t } = useI18n()
  const summary = summarizeProjectTasks(tasks)

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <CheckSquare size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{t('tasks.title')}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{t('tasks.desc')}</div>
        </div>
      </div>

      {tasks.length > 0 ? (
        <>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {t('tasks.summary', { done: summary.done, total: summary.total, open: summary.open })}
          </div>
          <ul
            style={{
              margin: '0 0 12px',
              padding: '12px 12px 12px 28px',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              lineHeight: 1.55,
              maxHeight: '140px',
              overflow: 'auto',
            }}
          >
            {tasks.slice(0, 8).map((task) => (
              <li
                key={`${task.line}-${task.text}`}
                style={{
                  textDecoration: task.done ? 'line-through' : 'none',
                  color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {task.text}
              </li>
            ))}
            {tasks.length > 8 ? <li style={{ color: 'var(--text-secondary)' }}>…</li> : null}
          </ul>
        </>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('tasks.empty')}</div>
      )}

      <button type="button" className="btn btn-secondary" onClick={onEditTasks}>
        {tasks.length > 0 ? t('tasks.open') : t('tasks.create')}
      </button>
    </div>
  )
}
