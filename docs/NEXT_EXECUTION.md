# 当前执行入口

> **更新**：2026-06-06 — **v1.5.9 收官** · 进入 **v1.6.0 评审**

---

## 策略

- **v1.5.1–1.5.9** ✅ patch 线全部交付
- **v1.6 门**：tag `v1.5.9` · smoke 连续 2 周 5/5 · ROADMAP 评审
- **Patch 详表**：[ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)

---

## 当前：v1.6.0 启动评审

| 条件 | 状态 |
|------|:----:|
| v1.5.9 tag + deploy | ☐ |
| smoke 2 周 5/5 | ☐ |
| `ROADMAP_V1.6.md` 签字 | ☐ |

---

## 门禁

```bash
npm run verify:release:gates
npm run verify:env:v15
npm run verify:stripe:prices
npm run verify:alipay:prices
npm run smoke:production -- https://ai-ide-flame.vercel.app
```

**Kickoff**：[V1.6_KICKOFF.md](./V1.6_KICKOFF.md)
