# Release Notes — v1.3.1 GA 收口 · 生产门禁

> **日期**：2026-06-05  
> **上一版**：v1.3.0（F1–F7 能力）  
> **类型**：patch · 零宣传

---

## 一句话

**E2E/stack 热修收口**、**生产 smoke 适配 1.3.x**、**V1.3_ENV 生产策略** — 让 v1.3.0 成为可 tag、可部署的稳定基线。

---

## 变更摘要

| 主题 | 说明 |
|------|------|
| **E2E UI** | `plugin-ops` 登录 shim、审核筛选、v1.3 设置卡稳定 |
| **Stack E2E** | 云工作区乐观列表 + 徽章断言 |
| **生产 smoke** | `smoke-production` 接受 health `1.3.x` |
| **部署文档** | [V1.3_ENV.md](./V1.3_ENV.md) 生产推荐表 |
| **版本** | `package.json` → **1.3.1** · `/api/health` 对齐 |

---

## 含 v1.3.0 能力（若未单独打 v1.3.0 tag）

Python 跨文件 F12 · embedding 持久化 · 索引遥测 · Agent 索引上下文 · Tab/后台 Agent/插件/v1.3 设置卡 — 见 [RELEASE_NOTES_v1.3.0.md](./RELEASE_NOTES_v1.3.0.md)。

---

## 验证

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack
npm run smoke:production -- https://ai-ide-flame.vercel.app
```

---

## 下一版

[v1.3.2](./V1.3.2_KICKOFF.md) — Tab 抛光 · 条件断点 · 插件样例（v1.3.1 GA 后启动）。
