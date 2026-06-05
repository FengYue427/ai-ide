# Release Notes — v1.4.0 基础填坑 · 冲 3.4

> **日期**：2026-06-05 · **前置**：v1.3.9

## F1 — Tab/FIM 生产级

- P50/P95 延迟分位与 `<800ms` 目标判定
- `VITE_TAB_FIM_PRODUCTION`：强制 Tab on + 300ms debounce

## F2 — 索引 2k / Worker

- `VITE_INDEX_2K_PRODUCTION`：Worker 阈值降至 40
- 设置页索引构建模式：`auto` / `worker` / `sync`

## F3 — Git 面板

- 状态矩阵摘要（staged/unstaged/total）
- 块级 hunk stage（`gitHunkStageService` + `GitHunkStagePanel`）

## F4 — 桌面壳

- `VITE_DESKTOP_SHELL_PRODUCTION` 策略位
- 沿用 Electron 自动恢复上次项目

## F5 — 后台 Agent

- `VITE_BACKGROUND_AGENT_PRODUCTION` 生产默认可开路径
- 设置卡展示生产策略状态

## F6 — MCP/插件

- `VITE_MCP_PLUGIN_PRODUCTION` + 官方目录计数展示

## F7 — 平台 GA

- `v14Features` 汇总 F1–F6
- `V1.4_ENV.md` · `e2e/v14-features.spec.ts`

## 验证

```bash
npm run test:local
```
