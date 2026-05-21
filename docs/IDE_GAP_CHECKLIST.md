# 与 Cursor / Kiro 级 IDE 的差距清单

> 对照对象：**Cursor**（VS Code + 全仓 AI）、**Kiro**（规格驱动 Agent IDE）。  
> 基线版本：`v1.0.0-rc.1` · 执行跟踪与 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 并行。

**评分说明**：0 = 无 · 1 = 演示 · 2 = 可用 · 3 = 生产级 · 4 = 行业领先  
**目标分**：日常主力 IDE 需多数维度 ≥ 3。

---

## 总览（当前 → 目标）

| 维度 | 当前 | 目标 | 差距 |
|------|:----:|:----:|------|
| 编辑器核心 | 2.5 | 3.5 | 中 |
| 语言服务 / 导航 | 1.5 | 3.5 | **大** |
| 代码库理解 / 检索 | 1.5 | 3.5 | **大** |
| AI 与编辑融合 | 2.0 | 3.5 | **大** |
| Agent / 自动化 | 1.5 | 3.0 | **大** |
| 运行 / 调试 / Git | 2.0 | 3.0 | 大 |
| 扩展 / MCP | 0.5 | 3.0 | **极大** |
| 协作 / 团队 | 1.0 | 2.5 | 大 |
| 商业化 / 部署 | 2.0 | 3.0 | 中 |
| **综合（主力 IDE）** | **~1.8** | **~3.2** | **约一代产品** |

---

## A. 编辑器与导航

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| A1 | 多文件 / 标签 / 主题 | 完整 | Monaco + 9 主题 | 保持 | ✅ |
| A2 | 全局搜索替换 | 强 | 工作区范围 + 正则 + 替换预览 | 保持 | ✅ IDE-3 |
| A3 | **跳转到定义** | LSP | TS/JS 多文件 extraLibs + 符号回退 | 全语言 LSP | ✅ IDE-2 基础 |
| A4 | **查找引用** | LSP | Shift+F12 跨文件引用 | 全语言 LSP | ✅ IDE-2 基础 |
| A5 | **符号大纲** | 侧栏 | 侧栏「大纲」 | 当前文件 outline | ✅ IDE-2 |
| A6 | **@ 文件 / 符号** | Chat/Composer | 命令面板 `@` + 索引 | Chat 内 @ 提及 | ✅ IDE-1（面板） |
| A7 | Diff / Apply 单块 | 内联 diff | DiffViewer + 按块接受/拒绝 | 块级 diff 预览 | ✅ IDE-3 |
| A8 | 多光标 / 重构 | 完整 | 基础 Monaco | 逐步补齐 | ⬜ |

---

## B. 代码库理解（对标 Cursor Index）

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| B1 | 全仓文件树上下文 | 索引 + 向量 | 全量清单 + 未选摘要 + 选中全文 | 全量文件列表 + 摘要 | ✅ IDE-3 |
| B2 | **语义 / 向量检索** | 有 | BYOK embedding + Chat 上下文注入 | 可选 embedding API | 🔶 IDE-3 |
| B3 | **符号索引** | 有 | 正则索引 + `projectIndexManager` 自动重建 | 增量 + 向量 | ✅ IDE-2 |
| B4 | .gitignore / 忽略规则 | 有 | 默认目录 + 工作区 `.gitignore` | 统一忽略大文件/依赖 | 🔶 |
| B5 | 大仓库性能 | 本地磁盘 | 浏览器 10MB/100 文件限制 | 分片 + 懒加载 | ⬜ |

---

## C. AI 与编辑融合

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| C1 | Tab 级补全 | Copilot++ | 行级 AI 补全 | 保持并降延迟 | 🔶 |
| C2 | Chat + 选中上下文 | 强 | 有 | 保持 | ✅ |
| C3 | **Composer 多文件** | 强 | Agent + `agentApplyService` 确认应用 | Diff 预览 + 部分接受 | ✅ IDE-1 基础 |
| C4 | **Rules / 项目指令** | .cursorrules | `.aide/rules.md` 注入 + 设置中心编辑入口 | 设置 UI 编辑 | ✅ IDE-3 |
| C5 | MCP 工具 | 有 | 代理 + 设置 + 自动跟进轮次 | MCP 客户端骨架 | 🔶 Phase IDE-3 |
| C6 | 后台 Agent | 有 | 无 | 长任务队列（需后端） | ⬜ |

---

## D. 运行、调试、Git

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| D1 | 终端 | 集成 | terminalBridge | 保持 | 🔶 |
| D2 | **调试器** | 完整 | 无 | 浏览器内断点（难）或说明限制 | 🔶 见 BROWSER_LIMITATIONS |
| D3 | Git UI | 完整 | 分支切换、放弃改动、diff | status/diff/branch 面板 | 🔶 |
| D4 | WebContainer 运行 | N/A 本地 | 有 | 文档化限制 | 🔶 |
| D5 | 任务 / npm scripts | 有 | 命令面板 `npm run` | 运行 package.json scripts | 🔶 IDE-3 |

---

## E. 平台与产品

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| E1 | 桌面原生 | 是 | 浏览器 | 可选 Electron 壳（长期） | 🔶 见 ELECTRON_EVAL |
| E2 | 账号 + 云同步 | 有 | 有 API | 生产部署稳定 | 🚧 P0 |
| E3 | 国内支付 | 无 | 骨架 | 沙箱 → 生产 | 🚧 P1 |
| E4 | 插件市场 | VS Code | 沙箱示例 | 清单 + 安装流 | ⬜ |
| E5 | 实时协作 | 有 | Yjs 实验 | 标注「实验」或加深 | 🔶 |

---

## F. 工程与发布（P0，必须先绿）

| ID | 任务 | 状态 |
|----|------|------|
| F1 | `vercel.json` 不吞 `/api/*` | ✅ |
| F2 | Vercel `APP_URL` + health JSON | 🔶 (`npm run deploy:check`) |
| F3 | `test:integration:local` 全绿 | 🔶 |
| F4 | E2E 欢迎页/订阅回归 | ✅（`e2e/helpers` + CI preview） |

---

## 执行阶段（与 OPTIMIZATION_PLAN 对齐）

### Phase IDE-1（已完成基础）— 缩小「AI 不懂仓库」差距

- [x] `projectIndexService`：文件 + 符号索引、搜索
- [x] `agentApplyService`：解析 `### path` + 代码块
- [x] 命令面板 `@` 跳转符号 / 文件（`Ctrl+Shift+P` → `@login`）
- [x] Chat Agent：解析后「应用 N 个文件」确认条
- [x] 工作区变更时自动重建索引（`useProjectIndexSync`）
- [x] Chat 输入框内 `@` 自动补全（IDE-2）

### Phase IDE-2（已完成基础）— 编辑体验

- [x] 当前文件 Outline（侧栏「大纲」）
- [x] TS/JS 跨文件 IntelliSense + F12（`syncTypeScriptProject` + 定义提供者）
- [x] 项目 Rules（`.aide/rules.md` / `.cursorrules`）注入 system prompt
- [x] Chat 输入框 `@` 提及补全
- [x] 块级 Diff Apply（Agent 变更预览弹窗）
- [x] 工作区变更时索引增量更新（防抖全量 + `patchIndexedFile` API）
- [x] 默认忽略 `node_modules` / `dist` 等目录

### Phase IDE-3 — 平台级

- [x] MCP 配置与工具调用（骨架：`/api/mcp/proxy`、设置中心、Agent `<<<mcp-tool>>>` 块）
- [x] Git 面板增强（分支切换、放弃改动、同步编辑器）
- [x] 向量检索骨架（BYOK embedding → Chat 工作区上下文）
- [x] 命令面板运行 `package.json` scripts（WebContainer 终端）
- [x] Git 切换分支同步编辑器 + 工作区 IndexedDB
- [x] 工作区搜索替换写回 `workspaceContextService`
- [x] Agent 应用 / Chat 生成文件同步到工作区 IndexedDB
- [x] 工作区 prompt：全量文件清单 + 未选中摘要（B1）
- [x] Agent Diff 按变更块部分应用（`diffHunkService`）
- [x] 设置中心：项目规则 `.aide/rules.md` 编辑入口
- [x] 浏览器能力边界文档 `docs/BROWSER_LIMITATIONS.md`
- [x] Electron 壳评估文档 `docs/ELECTRON_EVAL.md`（未实现代码）
- [x] `npm run rc:preflight` 发版前检查
- [x] 编辑器保存同步工作区 IndexedDB + 符号索引 patch

---

## 验收口径（每个 Phase）

| Phase | 用户可感知结果 |
|-------|----------------|
| IDE-1 | `Ctrl+Shift+P` 输入 `@auth` 能跳到符号；Agent 改 3 个文件可一键应用 |
| IDE-2 | 侧栏看到函数列表；F12 在 TS 文件跳转 |
| IDE-3 | 配置 MCP 后 Agent 可调外部工具 |

---

## 相关文档

- [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)
- [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
