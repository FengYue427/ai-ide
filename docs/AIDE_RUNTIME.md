# AIDE Runtime — AI IDE 独属运行体系

> **版本**：RFC **v0.2**（2026-06-05 · v1.4.4 评审）  
> **状态**：RFC 定稿 · v1.5 F3–F6 实现  
> **ADR**：[ADR_V1.5_AIDE_RUNTIME.md](./ADR_V1.5_AIDE_RUNTIME.md) ✅  
> **前置能力**：v1.1.1 Plan/Spec 队列 · v1.3 Agent 可靠 · v1.4 生产策略 · v1.4.3 Tab++ POC  
> **战略**：[V1.5_STRATEGY_PIVOT.md](./V1.5_STRATEGY_PIVOT.md)

---

## 1. 一句话

**AIDE Runtime** 是把「写计划 → 写规格 → Agent 执行 → Diff 应用 → 验收留档」从分散功能，升级为 **可重复、可触发、可观测** 的运行内核——类似 Kiro 的 Spec 工程化，但 **浏览器原生、BYOK、轻量 Hooks**，并与 **Tab++** 共享同一上下文总线。

对外话术（内部，非宣传）：

> 在浏览器里用 **Spec 工件 + Hooks** 驱动 Agent 闭环，Tab 补全与 Agent 改码共享同一仓库理解。

---

## 2. 与 Kiro / Cursor 的差异

| | **Kiro** | **Cursor** | **AIDE Runtime** |
|--|----------|------------|------------------|
| 核心单元 | Spec + Hook + Bedrock | Composer + Rules | **Spec 目录 + hooks.yaml + Queue** |
| 触发 | Agent Hooks 全链路 | 手动 Composer | **YAML 触发 + 队列 + 可选 Hook** |
| 验收 | Spec 驱动 | 用户目视 | **acceptance.md + 自动检查器** |
| 留档 | CloudTrail 级 | 弱 | **`.aide/reports/` + Runtime 状态** |
| 壳 | Code OSS fork | VS Code fork | **浏览器 + 可选 Electron** |
| 模型 | Bedrock 绑定 | 平台绑定 | **BYOK 默认** |

**我们不做的 Kiro 子集**：企业审计链、Bedrock 独占、CLI 全栈。  
**我们要的 Kiro 子集**：Spec 工件纪律、Hook 触发、验收闭环。

---

## 3. 六层架构

```
┌─────────────────────────────────────────────────────────┐
│  L6 Memory    reports/ · runtime-state.json · 索引注入   │
├─────────────────────────────────────────────────────────┤
│  L5 Verify    acceptance 检查 · 测试命令 Hook · 失败回流  │
├─────────────────────────────────────────────────────────┤
│  L4 Apply     Diff hunk · AgentApply · Git stage 联动    │
├─────────────────────────────────────────────────────────┤
│  L3 Execute   Agent Queue · 后台 Job · MCP 工具轮次       │
├─────────────────────────────────────────────────────────┤
│  L2 Spec      tasks.md · acceptance.md · hooks.yaml      │
├─────────────────────────────────────────────────────────┤
│  L1 Intent    Chat · 命令面板 · Plan 勾选 · Tab 上下文    │
└─────────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
    Tab++ 上下文总线    Activity Line 事件流
```

### L1 Intent（意图）

- 入口：Chat Agent、Plan 步骤勾选、Spec 任务入队、命令面板「从 Spec 执行」
- 输出：规范化 `RuntimeIntent`（`kind: plan|spec|adhoc`，`targetPath`，`prompt`）

### L2 Spec（工件）

工作区约定（扩展 v1.1.1）：

```
.aide/
  specs/
    <feature>/
      tasks.md          # 任务清单（已有）
      acceptance.md     # 验收标准（已有）
      hooks.yaml        # v1.5 新增：触发器
  plans/                # 计划（已有）
  reports/              # 执行报告（已有）
  meta/
    plan-spec-links.json
    runtime-state.json  # v1.5 新增：最近 Spec、队列快照、Hook 日志
```

### L3 Execute（执行）

- 复用 `queuedSpecExecutions` / `queuedPlanExecutions` / `ChatPanel` 排水逻辑
- 新增：`runtimeOrchestrator.enqueue(RuntimeIntent)` 统一入队（ADR D1 · v1.5 F4 双写迁移）
- `hookRunner` 在 `queue.before|after` · `apply.after` · `verify.fail` 插入（ADR D2）
- Activity Line 经 `runtimeEventBus` 订阅（ADR D6）

**现有代码锚点**：

| 模块 | 路径 |
|------|------|
| Spec 队列 | `src/services/specQueuePersistenceService.ts` |
| Plan 队列 | `src/services/planQueuePersistenceService.ts` |
| Plan↔Spec | `src/services/planSpecLinkService.ts` |
| 报告 | `src/services/queueExecutionReportService.ts` |
| 入队 UI | `src/app/PanelHost.tsx` · `src/components/ChatPanel.tsx` |

### L4 Apply（应用）

- 复用 `agentApplyService` + `diffHunkService`
- Hook：`post-apply` → 可选自动 `git add` 片段 / 打开相关文件

### L5 Verify（验收）

- 解析 `acceptance.md`：`- [ ]` checkbox + ` ```aide-acceptance ` 命令块（ADR D4）
- `acceptanceRunner`：桌面真终端；浏览器 WebContainer 能跑则跑，否则 skip + 警告
- 失败 → `verify.fail` Hook → `enqueue` 修复任务或暂停队列

### L6 Memory（记忆）

- 队列完成 → 自动报告（v1.1.0.16 规划项，v1.5 默认开）
- `runtime-state.json` 供下次打开恢复「进行中的 Spec」
- 索引注入：`.aide/specs/**` 高优先级进入 Agent 上下文

---

## 4. hooks.yaml 规范（草案）

```yaml
# .aide/specs/auth-login/hooks.yaml
version: 1
hooks:
  - id: pre-run-tests
    on: queue.before   # queue.before | queue.after | apply.after | test.fail
    run: shell
    command: npm run test:local
    cwd: ${workspaceRoot}

  - id: post-apply-lint
    on: apply.after
    run: agent
    prompt: "对刚应用的文件跑 lint 并修复明显问题"

  - id: on-acceptance-fail
    on: verify.fail
    run: enqueue
    spec: auth-login
    task: "修复验收失败项"
```

**v1.5 范围**：`queue.before` · `queue.after` · `apply.after` · `verify.fail` 四类；`run: shell|agent|enqueue`。

**浏览器 shell Hook**：skip + toast（ADR D3），不伪造执行。

### 4.1 `RuntimeIntent`（ADR D1）

```typescript
export type RuntimeIntentKind = 'plan' | 'spec' | 'adhoc'

export interface RuntimeIntent {
  kind: RuntimeIntentKind
  targetPath: string
  prompt: string
  backfill?: {
    taskPath: string
    taskText: string
    specAcceptancePath?: string
  }
  source?: 'chat' | 'palette' | 'plan-map' | 'hook'
}
```

### 4.2 `acceptance.md` 示例（ADR D4）

~~~markdown
# 验收 — auth-login

- [ ] 登录按钮可见
- [ ] 单元测试通过

```aide-acceptance
commands:
  - npm run test:local
```
~~~

### 4.3 `runtime-state.json`（ADR D5）

见 [ADR_V1.5_AIDE_RUNTIME.md](./ADR_V1.5_AIDE_RUNTIME.md) D5 完整 schema。

---

## 5. Activity Line（活动线）

对标 Windsurf Cascade 的 **轻量版**：

| 事件 | UI |
|------|-----|
| Agent 开始改文件 | 活动线条目 + 文件路径 |
| 终端输出（桌面） | 尾部 N 行注入 Chat 上下文（可选） |
| Tab 补全接受 | 可选记入「最近编辑」供 FIM |
| Hook 执行 | 状态徽章（running / ok / fail） |
| 队列排水 | 进度 `2/5` |

组件落点：`WorkbenchAuxiliaryHost` 或 Chat 面板顶部 **可折叠活动条**（`data-testid="aide-activity-line"`）。

---

## 6. 与 Tab++ 的协同

| 机制 | 说明 |
|------|------|
| **共享上下文总线** | 当前 Spec、`tasks.md` 未完成项、最近 Activity 编辑 → Tab FIM prefix |
| **模式切换** | 「Spec 模式」下 Tab 优先补全与当前 task 相关的样板 |
| **不混淆** | Tab 请求不走 Queue；仅读取 Runtime 只读快照 |

---

## 7. v1.5 实现映射

| Runtime 能力 | v1.5 阶段 | 关键模块（拟） |
|--------------|-----------|----------------|
| hooks.yaml 解析 | F3 | `src/services/runtime/hooksSchema.ts` |
| Hook 执行引擎 | F4 | `src/services/runtime/hookRunner.ts` |
| runtimeOrchestrator | F4 | `src/services/runtime/runtimeOrchestrator.ts` |
| Activity Line UI | F5 | `src/components/ActivityLine.tsx` |
| acceptanceRunner | F6 | `src/services/runtime/acceptanceRunner.ts` |
| runtime-state 持久化 | F6 | `src/services/runtime/runtimeState.ts` |
| E2E | F7 | `e2e/aide-runtime.spec.ts` |

---

## 8. 验收口径（v1.5 GA）

| # | 用户故事 | 验收 |
|---|----------|------|
| 1 | 新建 Spec 含 hooks.yaml | 设置中心可浏览；YAML 校验错误有 toast |
| 2 | 执行 Spec 队列 | `queue.before` hook 先跑测试；失败则暂停 |
| 3 | Agent 改 2 文件并应用 | `apply.after` hook 触发；Activity Line 可见 |
| 4 | acceptance.md 含 `npm test` | 自动跑；失败 enqueue 修复任务 |
| 5 | 关页重开 | `runtime-state.json` 恢复队列预览 |
| 6 | Tab++ 在 Spec 模式 | 补全与当前 task 语义相关（主观 + 单测 mock） |

---

## 9. 风险与诚实边界

| 风险 | 缓解 |
|------|------|
| Hook 跑 shell 在浏览器不可用 | 文档标注；桌面壳完整支持；浏览器降级为 skip + 警告 |
| 与现有 Plan/Spec UI 重复 | F4 先抽 orchestrator，UI 渐进迁移 |
| Tab++ 延迟 | F1/F2 独立交付，不阻塞 Runtime |
| 范围膨胀 | F3–F6 严格按 hooks 四类；不做 Kiro 全量 Hook 市场 |

---

## 10. v1.4.x → v1.5 交付节奏

| patch | 交付 |
|-------|------|
| **1.4.4** ✅ | RFC v0.2 · ADR 评审 |
| **1.4.5** ✅ | `hooksSchema.ts` · 设置 YAML 预览 |
| **1.4.7** ✅ | Spec 目录 UI · `runtime-state` 类型 |
| **1.4.8** ✅ | Activity Line RFC · orchestrator 接口 stub |
| **v1.5 F3–F7** | 生产实现 + E2E |

---

## 11. 相关文档

- [ADR_V1.5_AIDE_RUNTIME.md](./ADR_V1.5_AIDE_RUNTIME.md) — 架构决策（v1.4.4）
- [PLAN_SYSTEM_QUICKSTART.md](./PLAN_SYSTEM_QUICKSTART.md) — 现有 Plan/Spec 上手
- [ROADMAP_V1.1.0_PLAN_SYSTEM.md](./ROADMAP_V1.1.0_PLAN_SYSTEM.md) — 历史规划
- [V1.5_KICKOFF.md](./V1.5_KICKOFF.md) — 执行阶段
- [V1.5_F1_TAB_PLUS_PLUS.md](./V1.5_F1_TAB_PLUS_PLUS.md) — Tab++ 协同
