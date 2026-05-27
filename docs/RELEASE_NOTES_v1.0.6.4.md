# Release v1.0.6.4 — v1.0.6 收官

**Date**: 2026-05-27  
**Production**: https://ai-ide-flame.vercel.app

## Highlights

v1.0.6 主题：**每个交付在 UI 里可见可感受**。

| 版本 | 主题 | 要点 |
|------|------|------|
| **1.0.6.1** | Agent | `AgentToolPanel` · `move_file` / `delete_file` / `create_dir` |
| **1.0.6.2** | 文件管理 | 工作区树右键 · F2/Delete · 新建文件夹 |
| **1.0.6.3** | 插件 | 官方目录 **6** 款 · 标签筛选 · ★ 评分 |
| **1.0.6.4** | 收官 | 竞品复评 **~2.90** · 发布矩阵 |

## Agent（1.0.6.1）

- Chat 内可折叠 **工具调用面板**（工具名、摘要、成功/失败、hunk 数）
- Agent 新增 **move_file**、**delete_file**、**create_dir**

## 工作区（1.0.6.2）

- 文件树 **右键菜单**：重命名、移动、删除、新建子文件夹
- **F2** 重命名、**Delete** 删除
- 操作后自动重建项目索引

## 插件市场（1.0.6.3）

- 新增：JSON 格式化、TODO 扫描、行数统计、Markdown 预览+
- 市场 Tab：**标签筛选** + 官方 **★ 评分** 徽章

## Quality

- `npm run test:local` — **222** tests
- `npm run mcp:smoke` — MCP catalog + proxy

## Docs

- [V1.0.6_MASTER_PLAN.md](./V1.0.6_MASTER_PLAN.md)
- [COMPETITOR_COMPARISON_V1.0.2.md](./COMPETITOR_COMPARISON_V1.0.2.md) §0.2（~2.90）

## Upgrade

- Web：刷新 https://ai-ide-flame.vercel.app
- Desktop：GitHub Releases → latest

## Next

- **v1.1** Kickoff — [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)
