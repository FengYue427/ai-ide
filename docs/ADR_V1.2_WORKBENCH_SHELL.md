# ADR：Workbench Shell（v1.2.2）

> **状态**：Accepted · **F1 ✅ · F2 ✅**  
> **关联**：[V1.2.2_KICKOFF.md](./V1.2.2_KICKOFF.md) · [WORKBENCH_QA.md](./WORKBENCH_QA.md)

---

## 1. 背景

工作台存在「固定宽度 + 绝对定位叠层」：搜索 `search-overlay`、预览 `preview-shell`、CodeReview/Performance `position:fixed`，可与右侧 Chat/Git 同时打开，导致遮挡。

## 2. 决策

### 2.1 辅助面（Auxiliary）单槽 — F1 ✅

以下面板**同一时刻最多一个**：

| 槽位 | Store 标志 |
|------|------------|
| `search` | `showSearchPanel` |
| `preview` | `showPreview` |
| `codeReview` | `showCodeReview` |
| `performance` | `showPerformance` |

实现：`src/lib/workbenchLayout.ts` 统一产出 patch；`useUIActions` 为唯一推荐入口。

### 2.2 与右侧栏互斥 — F1 ✅

打开任一 Auxiliary 时 **关闭** `showChatPanel` / `showGitPanel`。  
打开 Chat/Git 时 **关闭** 全部 Auxiliary。

### 2.3 布局 — F1 ✅

- Auxiliary 渲染在 `WorkbenchAuxiliaryHost`（`workspace-center` 内 **docked 列**），占 `--workbench-auxiliary-width`（默认 360px）。
- 预览不再使用 `preview-shell` 的 `position:absolute` 叠在编辑区上。

### 2.4 切换 — F1 ✅

Activity Bar 搜索/预览：已打开则关闭（toggle）。

### 2.5 全局 z-index 刻度 — F2 ✅

CSS 变量定义于 `src/styles/layers.css`；TS 常量 `src/lib/layers.ts`（`Z`）供内联样式使用。

| 刻度 | 变量 | 值 | 用途 |
|------|------|:--:|------|
| base | `--z-base` | 0 | 默认 |
| sticky | `--z-sticky` | 1 | 编辑器内加载遮罩 |
| local | `--z-local` | 2 | 终端 resize 等局部 |
| dropdown | `--z-dropdown` | 100 | 上下文菜单、Inline AI |
| workbench float | `--z-workbench-float` | 150 | 遗留 overlay 模块（非 docked） |
| modal | `--z-modal` | 1000 | Modal / Settings / Welcome |
| modal elevated | `--z-modal-elevated` | 1100 | 叠层 Modal（CN 支付等） |
| command | `--z-command` | 2500 | 命令面板 |
| toast | `--z-toast` | 3000 | Toast 栈 |
| confirm | `--z-confirm` | 4000 | 确认对话框 |
| fatal | `--z-fatal` | 5000 | ErrorBoundary |

**禁止** 在组件内使用 `10000` 等 ad-hoc 值；新增层须扩展 `layers.css` / `layers.ts`。

### 2.6 非目标

- 侧栏/右栏拖拽调宽（→ F4）
- `PanelHost` 拆分（→ 后续）

---

## 3. 验收

见 [WORKBENCH_QA.md](./WORKBENCH_QA.md)。
