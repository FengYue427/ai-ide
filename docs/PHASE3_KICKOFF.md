# Phase 3 启动（2026-05-24）

> **前置**：Phase 2 闭环 — D2 MLP（路径 A）已达标，见 [PHASE2_STATUS.md](./PHASE2_STATUS.md)、[LAUNCH_READINESS.md](./LAUNCH_READINESS.md)。

## 目标

在 **不启用收款（路径 B）** 的前提下，提升「日常主力 IDE」体验：索引、补全、协作或 LSP 择一深化。

## 推荐顺序（来自 [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)）

| 优先级 | ID | 内容 | 首步 |
|--------|-----|------|------|
| 1 | P4-1 续 | 向量分片、增量 embedding、索引 UI | [P4-1_INDEXING.md](./P4-1_INDEXING.md) |
| 2 | P4-4 | Tab 补全防抖 / 缓存 | `registerInlineCompletion` |
| 3 | P4-2 **或** P4-5 | LSP POC **或** 协作 M1 | 二选一，避免并行摊薄 |

## 可选（非阻塞）

| ID | 项 |
|----|-----|
| P2-7 | `VITE_SENTRY_DSN` — [OBSERVABILITY.md](./OBSERVABILITY.md) |
| P2-8 | Git remote PAT → SSH |
| P2-16 | 竞品分复评 — [COMPETITOR_SCORE_2026-05.md](./COMPETITOR_SCORE_2026-05.md) |

## 明确不做（本阶段）

- 路径 B 生产收款（支付宝 / 微信 / Stripe live）
- Electron 桌面壳（P4-7）
- 平台 AI 网关

## 对外

- 使用 [RC_ANNOUNCEMENT_2026-05.md](./RC_ANNOUNCEMENT_2026-05.md) 发帖
- 收集 Issue 标签建议：`bug` `i18n` `indexing` `collab`
