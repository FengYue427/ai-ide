# 当前执行入口

> **更新**：2026-06-01 — **v1.1.9 GA** · **1.1.8.x 收口** · 见 [PRODUCT_STATE_REVIEW_2026-06.md](./PRODUCT_STATE_REVIEW_2026-06.md)

---

## 世代状态

| 线 | 状态 | 文档 |
|----|------|------|
| **v1.1.8** | ✅ GA | [RELEASE_NOTES_v1.1.8.md](./RELEASE_NOTES_v1.1.8.md) |
| **v1.1.8.x** | ✅ 含 1.1.8.4 设置页 platformAi | [ROADMAP_V1.1.8.x_PATCHES.md](./ROADMAP_V1.1.8.x_PATCHES.md) |
| **v1.1.9** | ✅ tag `v1.1.9` | [RELEASE_NOTES_v1.1.9.md](./RELEASE_NOTES_v1.1.9.md) |
| **v1.2+** | 📋 大拓展 | [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |

---

## 建议下一迭代（择一主线）

### A. 调试 patch（1.1.7.1 条件断点 MVP）

见 [ROADMAP_V1.1.7.x_PATCHES.md](./ROADMAP_V1.1.7.x_PATCHES.md)

### B. 增长与稳定（推荐 2 周）

1. 生产 `VITE_AI_GATEWAY` + `PLATFORM_DEEPSEEK_API_KEY` 巡检  
2. `npm run smoke:report` 每周  
3. 教程 + GSC 关键词维护  
4. Collab CI 全绿后对外宣传协作

### C. v1.2 预研

插件签名 · 多根工作区 · DAP — **勿与 A/B 并行开大**

---

## 本地验证

```bash
npm run test:local
npm run test:e2e:collab   # 需 dev:stack:collab + DATABASE_URL
```
