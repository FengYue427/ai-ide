# Release Notes — v1.5.4 · 平台 AI 体验

> **Tag**：`v1.5.4`（含于 **v1.5.5** 合并发布）

## 北极星

新用户 **3 分钟上手** — 欢迎页平台 CTA · Free economy 限制清晰 · 无 BYOK 困惑。

## 交付

| 项 | 说明 |
|----|------|
| 欢迎页 | `welcome-platform-quota-hint` — 200 加权配额 / 经济模型 |
| 设置 AI | `settings-platform-economy-hint` — 免费仅 economy tier |
| 文案 | 平台-only 路径去掉 BYOK（cloud degraded · 用量仪表盘） |
| 套餐 fallback | Free 经济模型 · 无限工作区 · Team $19.99 |
| E2E | `e2e/platform-onboarding.spec.ts` |

## 门禁

```bash
npm run test:unit
npm run test:e2e:local -- e2e/platform-onboarding.spec.ts
```

## 下一 patch

**v1.5.5** — Stripe Price 生产 · 见 [RELEASE_NOTES_v1.5.5.md](./RELEASE_NOTES_v1.5.5.md)
