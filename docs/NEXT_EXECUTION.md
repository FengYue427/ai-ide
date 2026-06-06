# 当前执行入口

> **更新**：2026-06-05 — **v1.5.3** · 进入 **v1.5.4 平台 AI 体验**

---

## 策略

- **v1.5.1–1.5.2** ✅ 生产 env · Tab++ 默认 · P95 400ms
- **v1.5.3** ✅ Runtime 抛光（验收文案 · 队列恢复 · runtime-state 摘要）
- **Patch 详表**：[ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)

---

## 当前：v1.5.4（平台 AI 体验）

| 条件 | 状态 |
|------|:----:|
| 欢迎页平台 CTA 抛光 | ☐ |
| Free economy 限制清晰 | ☐ |
| 无 BYOK 困惑 | ☐ |

---

## 门禁

```bash
npm run test:local
npm run verify:env:v15
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
