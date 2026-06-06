# Release Notes — v1.5.3 · Runtime 抛光

> **日期**：2026-06-05 · **前置**：v1.5.2

---

## 交付

| # | 项 |
|---|-----|
| V1 | **验收失败文案** — `acceptanceVerifyMessages` · Chat 通知带未勾选项/命令详情 |
| V2 | **队列暂停/恢复** — hook 失败暂停 · 任务队列 `恢复队列` · 成功入队自动清除 |
| V3 | **runtime-state 可读** — 设置页 `settings-runtime-state-summary` · Spec 目录本地化行 |

---

## 验收

```bash
npm run test:unit          # ≥799
npm run verify:env:v15
npm run test:e2e:local     # aide-runtime.spec.ts
```

---

## 下一 patch

**v1.5.4** — 平台 AI 体验 · 见 [ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)
