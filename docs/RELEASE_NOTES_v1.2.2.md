# Release Notes — v1.2.2 Workbench Shell

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.0

---

## 一句话

IDE 工作台从「面板叠在编辑区上」升级为 **有互斥规则的 Shell**：辅助面 docked 单槽、统一层级、更紧凑的工具栏/聊天/设置，并支持侧栏与右栏拖拽调宽。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **辅助面** | 搜索 / 预览 / 代码审查 / 性能 — 同一 docked 列，互斥切换，不再遮挡编辑器 |
| **层级** | 命令面板、Modal、Toast 使用统一 `--z-*` 刻度 |
| **密度** | 工具栏 40px、Chat/Settings 间距收紧、默认右栏 360px |
| **Resize** | 侧栏/右栏可拖拽调宽，localStorage 记忆；窄屏 ≤900px 自动折叠侧栏 |
| **调试**（v1.2.1 合入） | 条件断点、命中次数、Watch 只读；跳定义走 `languageServiceHost` |

---

## 部署说明

- **无需** 新开 v1.2.0 功能开关（`VITE_MULTI_ROOT` 等仍默认关）
- 发版后执行：`npm run smoke:production` · Redeploy Vercel Production

---

## 验证

```bash
npm run test:local
npm run test:e2e -- e2e/workbench-layout.spec.ts
```

手测清单：[WORKBENCH_QA.md](./WORKBENCH_QA.md)

---

## 文档

- [ADR_V1.2_WORKBENCH_SHELL.md](./ADR_V1.2_WORKBENCH_SHELL.md)
- [V1.2.2_KICKOFF.md](./V1.2.2_KICKOFF.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
