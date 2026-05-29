import { PLAN_ROOT } from './planModeService'

export interface PlanTemplateItem {
  id: string
  title: string
  description: string
  source: 'builtin' | 'workspace'
  path?: string
}

interface FileLike {
  name: string
  content: string
  language?: string
}

const TEMPLATE_DIR_RE = /^\.aide\/plans\/_templates\/.+\.md$/i
const USER_PLAN_RE = /^\.aide\/plans(?!\/_templates\/).+\.md$/i

export const BUILTIN_PLAN_TEMPLATES: Array<PlanTemplateItem & { content: string }> = [
  {
    id: 'feature-dev',
    title: '功能开发',
    description: '从需求到验证的标准功能迭代清单',
    source: 'builtin',
    content: `# Feature Development Plan

- Created At: {{createdAt}}
- Tags: feature, template

## 目标

- 描述本次要交付的用户价值

## 影响文件

- 列出预计会改动的模块/文件

## 执行步骤

- [ ] 澄清需求与验收标准
- [ ] 设计接口与数据结构
- [ ] 实现核心逻辑
- [ ] 补充测试与文档
- [ ] 自测并准备合并

## 风险与回滚

- 列出主要风险与回滚方案

## 验证清单

- [ ] 关键路径手动验证
- [ ] 自动化测试通过
`,
  },
  {
    id: 'bugfix',
    title: 'Bug 修复',
    description: '定位、修复、回归验证三步走',
    source: 'builtin',
    content: `# Bugfix Plan

- Created At: {{createdAt}}
- Tags: bugfix, template

## 目标

- 修复问题并避免回归

## 影响文件

- 列出可疑模块

## 执行步骤

- [ ] 复现问题并记录现象
- [ ] 定位根因
- [ ] 实现修复
- [ ] 补充回归测试

## 风险与回滚

- 评估修复对周边功能影响

## 验证清单

- [ ] 原问题不再复现
- [ ] 相关用例通过
`,
  },
  {
    id: 'release',
    title: '发布清单',
    description: '发版前检查：构建、文档、部署与回滚',
    source: 'builtin',
    content: `# Release Checklist

- Created At: {{createdAt}}
- Tags: release, template

## 目标

- 安全发布当前版本

## 执行步骤

- [ ] 更新版本号与 CHANGELOG
- [ ] 运行测试与构建
- [ ] 检查环境变量与迁移脚本
- [ ] 部署到预发并冒烟
- [ ] 部署生产并监控

## 验证清单

- [ ] 健康检查通过
- [ ] 关键业务路径可用
`,
  },
]

function slugify(value: string): string {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '') || 'plan'
  )
}

function renderTemplateContent(raw: string, title: string, now: Date): string {
  const createdAt = now.toISOString()
  let content = raw.replace(/\{\{createdAt\}\}/g, createdAt)
  if (/^#\s+/m.test(content)) {
    content = content.replace(/^#\s+.+$/m, `# ${title}`)
  } else {
    content = `# ${title}\n\n${content}`
  }
  if (!/^-\s*Created/im.test(content)) {
    content = content.replace(/^#\s+.+$/m, (line) => `${line}\n\n- Created At: ${createdAt}`)
  }
  return `${content.trim()}\n`
}

function templateIdFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return fileName.replace(/\.md$/i, '')
}

export function listPlanTemplates(files: FileLike[]): PlanTemplateItem[] {
  const builtins: PlanTemplateItem[] = BUILTIN_PLAN_TEMPLATES.map(({ id, title, description, source }) => ({
    id,
    title,
    description,
    source,
  }))
  const custom: PlanTemplateItem[] = files
    .filter((file) => TEMPLATE_DIR_RE.test(file.name))
    .map((file) => {
      const id = `workspace:${templateIdFromPath(file.name)}`
      const title = file.content.match(/^#\s+(.+)\s*$/m)?.[1]?.trim() || templateIdFromPath(file.name)
      return {
        id,
        title,
        description: file.name,
        source: 'workspace',
        path: file.name,
      }
    })
  return [...builtins, ...custom]
}

export function resolvePlanTemplateContent(files: FileLike[], templateId: string): string | null {
  const builtin = BUILTIN_PLAN_TEMPLATES.find((item) => item.id === templateId)
  if (builtin) return builtin.content
  const custom = files.find((file) => {
    if (!TEMPLATE_DIR_RE.test(file.name)) return false
    return `workspace:${templateIdFromPath(file.name)}` === templateId
  })
  return custom?.content ?? null
}

export function buildPlanPathFromName(name: string, files: FileLike[] = [], now = new Date()): string {
  const stamp = now.toISOString().replace(/[:]/g, '-').replace(/\..+$/, '')
  const slug = slugify(name)
  let path = `${PLAN_ROOT}/${slug}-${stamp}.md`
  if (files.some((file) => file.name === path)) {
    path = `${PLAN_ROOT}/${slug}-${stamp}-${Math.random().toString(36).slice(2, 6)}.md`
  }
  return path
}

export function isUserPlanPath(path: string): boolean {
  return USER_PLAN_RE.test(path)
}

export function createPlanFromTemplate<T extends FileLike>(
  files: T[],
  templateId: string,
  planTitle: string,
  now = new Date(),
): { files: T[]; path: string; index: number } | null {
  const raw = resolvePlanTemplateContent(files, templateId)
  if (!raw) return null
  const title = planTitle.trim() || '新计划'
  const path = buildPlanPathFromName(title, files, now)
  const content = renderTemplateContent(raw, title, now)
  const file = { name: path, content, language: 'markdown' } as T
  const nextFiles = [...files, file]
  return { files: nextFiles, path, index: nextFiles.length - 1 }
}
