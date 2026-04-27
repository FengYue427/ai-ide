import { sendMessage, type AIConfig, extractCodeBlocks } from './aiService'
import { parseGitHubUrl, fetchRepoContents } from './githubService'

export interface AgentAction {
  type: 'write_file' | 'run_command' | 'install_dependency' | 'search' | 'explain' | 'ask_user'
  payload: any
}

export interface AgentTask {
  id: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  actions: AgentAction[]
  result?: string
}

export class AIAgent {
  private config: AIConfig
  private onAction: (action: AgentAction) => void | Promise<void>
  private onProgress: (task: AgentTask) => void

  constructor(
    config: AIConfig,
    onAction: (action: AgentAction) => void | Promise<void>,
    onProgress: (task: AgentTask) => void
  ) {
    this.config = config
    this.onAction = onAction
    this.onProgress = onProgress
  }

  async executeTask(description: string, context: {
    currentFile?: string
    currentCode?: string
    allFiles?: { name: string; content: string }[]
  }): Promise<void> {
    const task: AgentTask = {
      id: Date.now().toString(),
      description,
      status: 'running',
      actions: []
    }

    try {
      // 1. 分析任务并生成行动计划
      const plan = await this.generatePlan(description, context)
      task.actions = plan
      this.onProgress(task)

      // 2. 执行每个行动
      for (const action of plan) {
        await this.executeAction(action, context)
        await this.onAction(action)
      }

      task.status = 'completed'
      this.onProgress(task)
    } catch (error: any) {
      task.status = 'failed'
      task.result = error.message
      this.onProgress(task)
    }
  }

  private async generatePlan(description: string, context: any): Promise<AgentAction[]> {
    const systemPrompt = `你是一个 AI 编程助手，负责分析用户请求并生成行动计划。
可用操作类型：
- write_file: 写入文件，payload: { path, content }
- run_command: 运行命令，payload: { command, args? }
- install_dependency: 安装依赖，payload: { package, dev? }
- search: 搜索代码，payload: { query }
- explain: 解释代码，payload: { code }
- ask_user: 询问用户，payload: { question }

当前上下文：
${context.currentFile ? `当前文件: ${context.currentFile}` : ''}
${context.allFiles ? `项目文件: ${context.allFiles.map((f: {name: string}) => f.name).join(', ')}` : ''}

请分析用户请求 "${description}"，返回一个 JSON 数组的行动计划。只返回 JSON，不要其他文字。`

    const response = await sendMessage(this.config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description }
    ])

    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch {
      // 如果解析失败，创建一个默认的 explain 行动
      return [{
        type: 'explain',
        payload: { code: context.currentCode || '' }
      }]
    }
  }

  private async executeAction(action: AgentAction, context: any): Promise<void> {
    switch (action.type) {
      case 'write_file':
        // 文件写入由外部处理
        break
      case 'run_command':
        // 命令执行由外部处理
        break
      case 'install_dependency':
        // 依赖安装由外部处理
        break
      case 'search':
        // 搜索由外部处理
        break
      case 'explain':
        const explanation = await this.explainCode(action.payload.code || context.currentCode)
        action.payload.result = explanation
        break
      case 'ask_user':
        // 用户询问由外部处理
        break
    }
  }

  async explainCode(code: string): Promise<string> {
    const response = await sendMessage(this.config, [
      { role: 'system', content: '请详细解释这段代码的功能、原理和潜在问题。用中文回答。' },
      { role: 'user', content: code }
    ])
    return response
  }

  async refactorCode(code: string, goal: string): Promise<string> {
    const response = await sendMessage(this.config, [
      { 
        role: 'system', 
        content: `请重构这段代码以达到以下目标: ${goal}。输出完整的重构后代码块。` 
      },
      { role: 'user', content: code }
    ])
    return response
  }

  async generateFromPrompt(prompt: string, existingFiles: string[]): Promise<{ name: string; content: string }[]> {
    const response = await sendMessage(this.config, [
      {
        role: 'system',
        content: `请根据用户描述生成代码。如果涉及多个文件，请用 \`\`\`filename.ext 格式标注每个文件。
已有文件: ${existingFiles.join(', ')}` 
      },
      { role: 'user', content: prompt }
    ])

    const codeBlocks = extractCodeBlocks(response)
    return codeBlocks.map((block, idx) => ({
      name: block.language ? `generated-${idx}.${block.language}` : `generated-${idx}.txt`,
      content: block.code
    }))
  }

  async fixError(code: string, error: string): Promise<string> {
    const response = await sendMessage(this.config, [
      {
        role: 'system',
        content: '这段代码有错误，请找出问题并提供修复后的完整代码。'
      },
      { 
        role: 'user', 
        content: `代码:\n\`\`\`\n${code}\n\`\`\`\n\n错误信息: ${error}` 
      }
    ])
    return response
  }

  async importFromGitHub(url: string): Promise<{ name: string; content: string }[]> {
    const repo = parseGitHubUrl(url)
    if (!repo) {
      throw new Error('无效的 GitHub URL')
    }

    const result = await fetchRepoContents(repo.owner, repo.repo, '', repo.branch || 'main')
    if (result.error) {
      throw new Error(result.error)
    }

    return result.files.map(f => ({
      name: f.path,
      content: f.content
    }))
  }

  async autoComplete(code: string, cursorPosition: number): Promise<string> {
    const lines = code.slice(0, cursorPosition).split('\n')
    const currentLine = lines[lines.length - 1]
    const context = code.slice(Math.max(0, cursorPosition - 500), cursorPosition)

    const response = await sendMessage(this.config, [
      {
        role: 'system',
        content: '请根据上下文提供代码补全建议。只返回补全的代码片段，不要解释。'
      },
      {
        role: 'user',
        content: `当前行: ${currentLine}\n\n上下文:\n\`\`\`\n${context}\n\`\`\``
      }
    ])

    return response.replace(/```[\w]*\n?/g, '').trim()
  }
}

// 创建 Agent 实例的工厂函数
export function createAIAgent(
  config: AIConfig,
  onAction: (action: AgentAction) => void | Promise<void>,
  onProgress: (task: AgentTask) => void
): AIAgent {
  return new AIAgent(config, onAction, onProgress)
}
