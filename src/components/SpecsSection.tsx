import { useState } from 'react'
import type { Language } from '../i18n'

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

export function SpecsSection({ language, onCreateSpec, onOpenSpecsRoot, tasks, onMarkTaskDone, onRunTask }: SpecsSectionProps) {
  const [specName, setSpecName] = useState('')

  return (
    <div className="settings-card settings-card--grid">
      <div className="settings-row-title">Specs 工作流（requirements/design/tasks/acceptance）</div>
      <div className="settings-row-desc">
        在 `.aide/specs/&lt;name&gt;/` 下创建标准四件套，并自动进入 Chat/Agent 上下文。
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <input
          type="text"
          className="settings-input"
          style={{ flex: 1, minWidth: 220 }}
          value={specName}
          placeholder="例如: auth-refactor"
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
          创建 Spec
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOpenSpecsRoot}>
          打开 Specs
        </button>
      </div>
      {tasks.length > 0 ? (
        <div style={{ marginTop: 10, border: '1px solid var(--border-color)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Spec 任务（最近 8 条）</div>
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
                      执行任务
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => onMarkTaskDone(task.path, task.line)}>
                      标记完成
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
