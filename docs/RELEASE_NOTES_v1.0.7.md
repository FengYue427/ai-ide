# Release v1.0.7 — 体验抛光（8 项小优化 · 大收获）

**Date**: 2026-05-27  
**Production**: https://ai-ide-flame.vercel.app

## Highlights

v1.0.7 聚焦 **日常摩擦**：聊天可控、侧栏可读、上限可感知、错误可行动。

### 1–3 · 聊天与侧栏（延续用户反馈）

- **停止生成**：流式回复中点击暂停即可 `Abort`
- **Agent 默认开**：首次打开即 Agent，并记忆开关状态
- **文件树**：按路径分层；语言标签恢复自然大小写

### 4 · 文件上限可视化

- 左侧 **容量条** + 工具栏 **已打开 n / 上限 max**
- 接近上限（≥85%）预警；满额提示浏览器 **500** / 桌面 **2000**

### 5 · Chat UI v2

- 会话区层次与阴影加强
- 助手回复内 **\`\`\` 代码块** 独立样式
- 输入区圆角浮层卡片

### 6 · 413 / 请求过大

- 识别 `413` / `Content Too Large` 等
- 聊天内提示：关工作区上下文、减少 @、关语义检索、缩短历史

### 7 · 文件树展开/折叠

- 侧栏 **展开 / 折叠** 全部文件夹
- 打开 ≥8 个文件时 **自动展开第一层**

### 8 · 上限统一

- 工作区上下文文件数与项目索引 **同一套上限**（不再单独卡在 100）

## Upgrade

- **Web**：硬刷新 https://ai-ide-flame.vercel.app
- **Desktop**：GitHub Releases → `v1.0.7`

## Docs

- [V1.0.7_MASTER_PLAN.md](./V1.0.7_MASTER_PLAN.md)
- [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md)

## Next

- **v1.1** — [ROADMAP_V1.1.md](./ROADMAP_V1.1.md)
