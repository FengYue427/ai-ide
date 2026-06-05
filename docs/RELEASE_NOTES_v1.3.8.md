# Release Notes — v1.3.8 Agent 可靠 + Git/插件抛光

> **日期**：2026-06-05 · **合并发布**：v1.3.7 + v1.3.8 · **上一版**：v1.3.6

## v1.3.7 — Agent / Chat 可靠性

- 统一发送前 preflight：@ 提及 + 表计 payload + Agent tool-loop 路径
- Agent 文件应用失败可见（Toast + i18n）
- MCP 设置页展示工具数与 Chat 表计预留 KB

## v1.3.8 — Git 轻抛光 · 插件/MCP

- Git 状态刷新策略单测 + prefs 往返
- 单文件 `stageFile` 别名与 stage 按钮 testid
- `npm run seed:plugin-review` + dev:stack 社区插件走通文档

## 验证

```bash
npm run test:local
```
