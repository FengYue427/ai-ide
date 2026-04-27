export type AIModel = 'openai' | 'deepseek' | 'claude' | 'google' | 'ollama' | 'qwen' | 'zhipu' | 'minimax' | 'grok'

export interface AIConfig {
  provider: AIModel
  apiKey: string
  endpoint?: string  // 用于自定义 API 端点
  model?: string     // 具体模型名称
}

export const modelOptions: Record<AIModel, { name: string; models: string[]; needsKey: boolean; description?: string }> = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-5.4', 'gpt-5.4-thinking', 'gpt-5.4-pro', 'gpt-5', 'gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    needsKey: true,
    description: 'GPT-5.4系列是2026年3月发布的最新旗舰模型，统一了GPT和Codex产品线'
  },
  deepseek: {
    name: 'DeepSeek',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-r1', 'deepseek-chat', 'deepseek-coder'],
    needsKey: true,
    description: 'DeepSeek V4已于2026年4月24日发布（Preview版），官方确认API可用；模型名为deepseek-v4-pro / deepseek-v4-flash'
  },
  claude: {
    name: 'Claude (Anthropic)',
    models: ['claude-opus-4.7', 'claude-opus-4.6', 'claude-sonnet-4.6', 'claude-sonnet-4.5', 'claude-haiku-4'],
    needsKey: true,
    description: 'Claude Opus 4.6和Sonnet 4.6是2026年2月发布的最新模型，编程能力领先'
  },
  google: {
    name: 'Google Gemini',
    models: ['gemini-3.1-pro', 'gemini-3-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    needsKey: true,
    description: 'Gemini 3.1 Pro是2026年2月发布的最强全能模型，性价比极高'
  },
  qwen: {
    name: '阿里通义千问',
    models: ['qwen-3.5-max', 'qwen-3.5-plus', 'qwen-3.5-9b', 'qwen-3.5-4b', 'qwen-3.5-2b'],
    needsKey: true,
    description: 'Qwen 3.5系列2026年3月发布，0.8B-9B小模型支持iPhone本地运行'
  },
  zhipu: {
    name: '智谱AI GLM',
    models: ['glm-5', 'glm-5.1', 'glm-4-plus', 'glm-4-flash'],
    needsKey: true,
    description: 'GLM-5是2026年最重要的开源模型，744B参数，华为昇腾芯片训练'
  },
  minimax: {
    name: 'MiniMax',
    models: ['minimax-m2.5', 'minimax-m2.5-lightning'],
    needsKey: true,
    description: 'MiniMax M2.5在SWE-bench上得分80.2%，接近Claude Opus水平'
  },
  grok: {
    name: 'xAI Grok',
    models: ['grok-4.20', 'grok-4.20-reasoning'],
    needsKey: true,
    description: 'Grok 4.20系列：API可用性可能取决于账号权限/地区；如不可用请切换模型或更换endpoint'
  },
  ollama: {
    name: 'Ollama (本地)',
    models: ['llama4-maverick', 'llama4-scout', 'qwen2.5', 'glm4', 'codellama', 'mistral'],
    needsKey: false,
    description: 'Llama 4 Scout支持1000万token上下文，完全开源'
  }
}

export const defaultEndpoints: Record<AIModel, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  qwen: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  minimax: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
  grok: 'https://api.x.ai/v1/chat/completions',
  ollama: 'http://localhost:11434/api/generate'
}

export async function sendMessage(
  config: AIConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onStream?: (chunk: string) => void
): Promise<string> {
  const endpoint = config.endpoint || defaultEndpoints[config.provider]
  const model = config.model || modelOptions[config.provider].models[0]

  switch (config.provider) {
    case 'openai':
    case 'deepseek':
    case 'qwen':
    case 'zhipu':
    case 'minimax':
    case 'grok':
      // 这些provider使用OpenAI兼容的API格式
      return sendOpenAICompatible(endpoint, config.apiKey, model, messages, onStream)

    case 'google':
      return sendGoogleGemini(endpoint, config.apiKey, model, messages, onStream)

    case 'claude':
      return sendClaude(endpoint, config.apiKey, model, messages, onStream)

    case 'ollama':
      return sendOllama(endpoint, model, messages, onStream)

    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }
}

async function sendOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      stream: !!onStream
    })
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  if (onStream && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line === 'data: [DONE]') continue
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            const content = data.choices?.[0]?.delta?.content || ''
            fullContent += content
            onStream(content)
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
    return fullContent
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function sendClaude(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void
): Promise<string> {
  const system = messages.find(m => m.role === 'system')?.content || ''
  const conversation = messages.filter(m => m.role !== 'system')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: conversation.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
      stream: !!onStream
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function sendGoogleGemini(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void
): Promise<string> {
  // 转换OpenAI格式消息为Gemini格式
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  // 合并连续的相同角色消息
  const mergedContents = contents.reduce((acc: any[], curr: any) => {
    if (acc.length > 0 && acc[acc.length - 1].role === curr.role) {
      acc[acc.length - 1].parts[0].text += '\n\n' + curr.parts[0].text
    } else {
      acc.push(curr)
    }
    return acc
  }, [])

  // 确保第一条消息是用户消息
  if (mergedContents.length > 0 && mergedContents[0].role === 'model') {
    mergedContents.unshift({ role: 'user', parts: [{ text: 'Hi' }] })
  }

  const url = `${endpoint}/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: mergedContents,
      generationConfig: {
        temperature: 0.7,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function sendOllama(
  endpoint: string,
  model: string,
  messages: { role: string; content: string }[],
  onStream?: (chunk: string) => void
): Promise<string> {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: !!onStream
    })
  })

  if (!response.ok) {
    throw new Error('Ollama is not running. Start it with: ollama serve')
  }

  if (onStream && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          const content = data.response || ''
          fullContent += content
          onStream(content)
        } catch {
          // Ignore parse errors
        }
      }
    }
    return fullContent
  }

  const data = await response.json()
  return data.response
}

// 解析 AI 响应中的代码块
export function extractCodeBlocks(text: string): { language: string; code: string }[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const blocks: { language: string; code: string }[] = []
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    })
  }

  return blocks
}

// 生成代码相关的系统提示
export function generateCodePrompt(action: 'explain' | 'refactor' | 'generate' | 'fix', context: string): string {
  const basePrompt = `你是一个专业的编程助手。当前代码上下文:\n\n${context}\n\n`
  
  const prompts: Record<string, string> = {
    explain: basePrompt + '请详细解释这段代码的功能、原理和潜在问题。用中文回答。',
    refactor: basePrompt + '请重构这段代码，使其更清晰、高效、可维护。输出完整的重构后代码。',
    generate: basePrompt + '请根据需求生成代码。如需要多个文件，请用 ```filename.ext 格式标注。',
    fix: basePrompt + '这段代码有问题，请找出问题并提供修复后的完整代码。'
  }

  return prompts[action]
}
