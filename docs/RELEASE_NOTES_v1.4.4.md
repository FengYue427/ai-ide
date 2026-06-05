# Release Notes — v1.4.4 AIDE Runtime RFC · ADR

> **日期**：2026-06-05 · **上一版**：v1.4.3 · **类型**：patch · 架构文档

## 摘要

**无用户向功能代码**。定稿 AIDE Runtime 运行体系 RFC v0.2 与架构决策记录（ADR）。

## 交付

| 文档 | 说明 |
|------|------|
| [ADR_V1.5_AIDE_RUNTIME.md](./ADR_V1.5_AIDE_RUNTIME.md) | D1–D8：orchestrator · hooks · 浏览器降级 · Activity Line |
| [AIDE_RUNTIME.md](./AIDE_RUNTIME.md) | RFC v0.2 · RuntimeIntent · acceptance 块 · 代码锚点 |

## 核心决策（一览）

- **统一入队**：`runtimeOrchestrator`（v1.5 F4 双写迁移）
- **Hook 四类**：`queue.before|after` · `apply.after` · `verify.fail`
- **shell Hook**：浏览器 skip · 桌面执行
- **验收**：`acceptance.md` + ` ```aide-acceptance ` 命令块

## 下一版

**v1.4.5** — `hooksSchema.ts` · 设置页 YAML 预览

## 验证

```bash
npm run test:local
```
