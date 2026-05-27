# 1.0.6.x 附属路线图（1.0.6.1 → 1.0.6.4）

> **主版本**：[V1.0.6_MASTER_PLAN.md](./V1.0.6_MASTER_PLAN.md)  
> **下一世代**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md)

---

## 四级总览

| 版本 | 代号 | 状态 | 主题 | Git tag |
|:----:|------|:----:|------|---------|
| **1.0.6** | — | 🔶 | Kickoff | `v1.0.6` |
| **1.0.6.1** | **F4+F1** | 🔶 | Agent 文件工具 + 工具面板基础 | `v1.0.6.1` |
| **1.0.6.2** | **F2** | ✅ | 文件管理器增强 | `v1.0.6.2` |
| **1.0.6.3** | **F3** | 🔶 | 插件目录扩充（6 款 + 筛选） | `v1.0.6.3` |
| **1.0.6.4** | **收官** | ⏳ | live · Release · 竞品评分 | `v1.0.6.4` |

---

## 1.0.6.1 — F4 Agent 文件工具 + F1 工具面板

| ID | 交付 | 验收 |
|----|------|------|
| 6.1-1 | `move_file` 工具（含 workspace + disk sync） | 单测 |
| 6.1-2 | `delete_file` 工具（安全拦截 + confirm） | 单测 |
| 6.1-3 | `create_dir` 工具 | 单测 |
| 6.1-4 | Chat 侧工具调用日志面板（可折叠） | 手测 |
| 6.1-5 | `package.json` → **1.0.6.1** | health |

---

## 1.0.6.2 — F2 文件管理器增强

| ID | 交付 | 验收 |
|----|------|------|
| 6.2-1 | 文件树右键菜单（重命名/移动/删除/新建文件夹） | 手测 |
| 6.2-2 | F2 键 = 重命名行内编辑 | 手测 |
| 6.2-3 | Delete 键 = 删除确认 | 手测 |
| 6.2-4 | i18n 中英 | translations |

---

## 1.0.6.3 — F3 插件目录扩充

| ID | 交付 | 验收 |
|----|------|------|
| 6.3-1 | 新增 `json-formatter` 插件 | 手测 |
| 6.3-2 | 新增 `todo-scanner` 插件 | 手测 |
| 6.3-3 | 新增 `line-counter` 插件 | 手测 |
| 6.3-4 | 新增 `md-preview-plus` 插件 | 手测 |
| 6.3-5 | 插件市场：标签筛选 + 评分徽章 UI | 手测 |

---

## 1.0.6.4 — 收官

| ID | 交付 | 验收 |
|----|------|------|
| 6.4-1 | live 人工 5/5 | RC_LIVE_SPOTCHECK |
| 6.4-2 | GitHub Release `v1.0.6.4` | Notes |
| 6.4-3 | 竞品文档 → **~2.90** | COMPETITOR_COMPARISON |
| 6.4-4 | publish 渠道更新 | CSDN/掘金 |
| 6.4-5 | `NEXT_EXECUTION` → v1.1 Kickoff | — |

---

## 门禁

```powershell
npm run test:local
npm run mcp:smoke
npm run go-live:preflight
npm run rc:live-spotcheck
```
