import { useState } from 'react'
import { useI18n, type Language } from '../i18n'

interface SpecTaskItem {
  path: string
  text: string
  done: boolean
  line: number
}

interface SpecsSectionProps {
  language: Language
  onCreateSpec: (name: string, language: Language) => void
  onOpenSpecsRoot: () => void
  tasks: SpecTaskItem[]
  onMarkTaskDone: (path: string, line: number) => void
  onRunTask: (path: string, text: string) => void
}

export function SpecsSection({
  language,
  onCreateSpec,
  onOpenSpecsRoot,
  tasks,
  onMarkTaskDone,
  onRunTask,
}: SpecsSectionProps) {
  const { t } = useI18n()
  const [specName, setSpecName] = useState('')

  return (
    <div className="settings-card settings-card--grid" data-testid="spec-workflow-section">
      <div className="settings-row-title">{t('spec.workflow.title')}</div>
      <div className="settings-row-desc">{t('spec.workflow.desc')}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={specName}
          placeholder={t('spec.catalog.namePlaceholder')}
          onChange={(e) => setSpecName(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onCreateSpec(specName.trim(), language)
            setSpecName('')
          }}
        >
          {t('spec.workflow.create')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOpenSpecsRoot}>
          {t('spec.workflow.openRoot')}
        </button>
      </div>
      {tasks.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {t('spec.workflow.tasksRecent')}
          </div>
          <div style={{ display: 'grid', gap: 6, maxHeight: 180, overflow: 'auto' }}>
            {tasks.slice(0, 8).map((task) => (
              <div key={`${task.path}-${task.line}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    textDecoration: task.done ? 'line-through' : 'none',
                    color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                  }}
                >
                  {task.text}
                </span>
                {!task.done ? (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={() => onRunTask(task.path, task.text)}>
                      {t('spec.workflow.runTask')}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => onMarkTaskDone(task.path, task.line)}>
                      {t('spec.workflow.markDone')}
                    </button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
