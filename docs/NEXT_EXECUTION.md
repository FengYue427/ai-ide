# 当前执行入口

> **更新**：2026-06-05 — **v1.5.0 tag ✅** · 进入 **1.5.x 抛光线**

---

## 策略

- **技术 GA 已完成**：`v1.5.0` tag · F0–F8 · 789 单测 · 64 E2E
- **正式上市分三阶**：生产部署（1.5.1）→ 支付生产（1.5.5–6）→ 软上市（1.5.9 后可选）
- **Patch 详表**：[ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md)

---

## 当前：v1.5.1（GA 部署 + 细节抛光）

| 条件 | 状态 |
|------|:----:|
| `v1.5.0` tag | ✅ |
| `git push origin main && git push origin v1.5.0` | ☐ |
| Vercel prod env（`V1.5_ENV.md`） | ☐ |
| smoke 5/5 连续 2 周 | ☐ |
| Tab++/Runtime prod 默认策略评审 | ☐ |

---

## 下一世代

| 阶段 | 文档 |
|------|------|
| v1.5.1–1.5.9 | [ROADMAP_V1.5.x_PATCHES.md](./ROADMAP_V1.5.x_PATCHES.md) |
| v1.6.0 | [V1.6_KICKOFF.md](./V1.6_KICKOFF.md) · [ROADMAP_V1.6.md](./ROADMAP_V1.6.md) |

---

## 门禁

```bash
npm run test:local
npm run test:e2e:local
npm run smoke:production -- https://ai-ide-flame.vercel.app
```
