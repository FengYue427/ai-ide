import { describe, expect, it } from 'vitest'
import { promoteConversationToSpecBundle } from './vibeToSpecService'

describe('promoteConversationToSpecBundle', () => {
  it('creates spec with requirements and tasks from chat', () => {
    const bundle = promoteConversationToSpecBundle({
      specName: 'todo-api',
      locale: 'zh-CN',
      messages: [
        { role: 'user', content: '做一个待办 API，支持增删改查' },
        {
          role: 'assistant',
          content: '## 执行步骤\n\n- [ ] 设计路由\n- [ ] 实现 CRUD\n',
        },
      ],
    })

    expect(bundle.tasksPath).toContain('.aide/specs/todo-api/tasks.md')
    const req = bundle.files.find((f) => f.path.endsWith('requirements.md'))
    const tasks = bundle.files.find((f) => f.path.endsWith('tasks.md'))
    expect(req?.content).toContain('待办 API')
    expect(tasks?.content).toContain('- [ ] 设计路由')
    expect(tasks?.content).toContain('- [ ] 实现 CRUD')
  })
})
