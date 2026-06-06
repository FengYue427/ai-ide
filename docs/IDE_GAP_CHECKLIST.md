# 与 Cursor / Kiro 级 IDE 的差距清单

> 对照对象：**Cursor**（VS Code + 全仓 AI）、**Kiro**（规格驱动 Agent IDE）。  
> **复评版本**：**v1.5.0 GA** — [COMPETITOR_SCORE_V1.5.md](./COMPETITOR_SCORE_V1.5.md)  
> **战略转向**：[V1.5_STRATEGY_PIVOT.md](./V1.5_STRATEGY_PIVOT.md) — Tab++/Runtime **已交付首版**  
> 执行跟踪与 [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) 并行。

**评分说明**：0 = 无 · 1 = 演示 · 2 = 可用 · 3 = 生产级 · 4 = 行业领先  
**目标分**：v1.5 GA **≥3.50 ✅** → v1.6 **≥3.55**；宣传仍关闭直至单独决策。

---

## 总览（v1.5.0 达成 → v1.6 目标）

| 维度 | v1.5.0（估） | **v1.6 目标** | 差距 | v1.6 承接 |
|------|:------------:|:-------------:|------|-----------|
| 编辑器核心 | 3.5 | 3.5 | — | 维持 |
| 语言服务 / 导航 | 3.5 | 3.5 | — | 维持 TS/Python |
| 代码库理解 / 检索 | 3.6 | 3.6 | — | Runtime 注入维持 |
| AI 与编辑融合 | **3.7** | **3.8** | 小 | **v1.6 F0 Tab 默认开** |
| Agent / 自动化 | **3.7** | **3.8** | 小 | **v1.6 F3/F4 云 Agent · Runtime 抛光** |
| 运行 / 调试 / Git | 3.5 | 3.5 | — | 维持 |
| 扩展 / MCP | 3.0 | 3.0 | — | 维持 |
| 协作 / 团队 | 1.8 | 2.0 | 大 | v1.6 F5 RC |
| 商业化 / 部署 | **3.4** | **3.6** | 中 | **v1.6 F1 支付生产** |
| **综合（主力 IDE）** | **~3.50～3.52** | **≥3.55** | Tab 默认 · 支付 | [ROADMAP_V1.6.md](./ROADMAP_V1.6.md) |

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
| B5 | 大仓库性能 | 本地磁盘 | capped + embedding 持久化 | 2k Worker / 分片 | 🔶 → **v1.4 F2** |

---

## C. AI 与编辑融合

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| C1 | Tab 级补全 | Copilot++ | **Tab++ 生产**（`VITE_TAB_PLUS_PLUS` · 多行 ghost · P95&lt;400ms） | prod 默认开 · 主观跟手 | 🔶 → **v1.6 F0** |
| C2 | Chat + 选中上下文 | 强 | 有 | 保持 | ✅ |
| C3 | **Composer 多文件** | 强 | Agent + `agentApplyService` 确认应用 | Diff 预览 + 部分接受 | ✅ IDE-1 基础 |
| C4 | **Rules / 项目指令** | .cursorrules | `.aide/rules.md` 注入 + 设置中心编辑入口 | 设置 UI 编辑 | ✅ IDE-3 |
| C5 | MCP 工具 | 有 | 代理 + 设置 + 自动跟进轮次 | MCP 客户端骨架 | 🔶 Phase IDE-3 |
| C5b | **Chat @ 提及注入** | 有 | `@file` / `@path#symbol` → system prompt | 与索引联动 | ✅ P3 |
| C6 | 后台 Agent | 有 | 生产策略卡（v1.4 F5） | 云队列 30min 级 | 🔶 → **v1.6 F3** |
| C6b | **Spec / Hooks 工程** | Kiro 强 | **hooks 执行 + acceptance 自动化**（v1.5 F3–F6） | agent hook 排水 · 队列持久化 | 🔶 → **v1.6 F4** |
| C6c | **Activity Line** | Cascade 强 | **Activity Line 生产 UI**（v1.5 F5） | 终端 tail · 桌面深化 | 🔶 → **v1.6 F2** |

---

## D. 运行、调试、Git

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| D1 | 终端 | 集成 | terminalBridge | 保持 | 🔶 |
| D2 | **调试器** | 完整 | 无 | 浏览器内断点（难）或说明限制 | 🔶 见 BROWSER_LIMITATIONS |
| D3 | Git UI | 完整 | status 矩阵 + hunk stage | 保持 | ✅ v1.4 F3 |
| D4 | WebContainer 运行 | N/A 本地 | 有 | 文档化限制 | 🔶 |
| D5 | 任务 / npm scripts | 有 | 命令面板 `npm run` | 运行 package.json scripts | 🔶 IDE-3 |

---

## E. 平台与产品

| ID | 能力 | Cursor/Kiro | 我们现状 | 目标 | 状态 |
|----|------|-------------|----------|------|------|
| E1 | 桌面原生 | 是 | 浏览器 | 可选 Electron 壳（长期） | 🔶 见 ELECTRON_EVAL |
| E2 | 账号 + 云同步 | 有 | 有 API | 生产部署稳定 | 🚧 P0 |
| E3 | 国内支付 | 无 | 骨架 + v1.5 调价代码 | **Stripe/支付宝 新 Price 生产** | 🚧 → **v1.6 F1** |
| E3b | **订阅含 AI（无 BYOK）** | Cursor Pro | **平台多模型 · 弃 BYOK UI**（v1.5 F0） | 新 Price 生产 · 商户上线 | 🔶 → **v1.6 F1** |
| E4 | 插件市场 | VS Code | 官方目录 + 安装 Tab（M3） | 远程清单 + 签名 M2 | 🔶 P3 M3 ✅ |
| E5 | 实时协作 | 有 | Yjs + WebRTC Beta 文案 | 信令/冲突策略 | 🔶 Beta 已标注 |

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

### Phase IDE-4 — Cursor 级工作区 + Tool Agent（规划）

> 细致任务、里程碑、风险：**[PHASE_IDE4_CURSOR_PARITY.md](./PHASE_IDE4_CURSOR_PARITY.md)**

| 子阶段 | 周期 | 核心交付 | 状态 |
|--------|------|----------|------|
| **4a-1** | 1～2 周 | File System Access：打开/写回本地文件夹 | ✅ |
| **4a-2** | 2～4 周 | 内置工具 `read/write/list/search/run` | ✅ |
| **4a-3** | 3～5 周 | `agentRunner` 多轮 tool_calls（DeepSeek 等） | ✅ |
| **4a-4** | 5～7 周 | Agent 时间线 UI、E2E、文档 | ✅（E2E 可选） |
| **4a-RC** | +1～2 周 | 文档/回归/`v1.1.0-rc` | 🔶 文档 ✅；人工回归 ⬜ |
| **4b** | +4～6 周 | Electron 桌面壳（可选，GA 后） | ⬜ |
| **4c** | GA 后 | 大仓索引 / Cloud Agent（可选） | ⬜ |

| ID | 能力 | Cursor | 目标（4a 后） | 状态 |
|----|------|--------|---------------|------|
| C7 | **本地文件夹可写** | 原生 | FS Access 或 Electron | ✅ IDE-4a（浏览器）；4b Electron 增强 |
| C8 | **Tool-calling Agent** | 多轮 tools | agentRunner + 内置工具 | ✅ IDE-4a |
| C9 | 自动应用策略 | 可配置 | Diff 确认 + 设置项 | ✅ IDE-4a（`autoApplyWrites` 设置） |

---

## 相关文档

- [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)
- [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
