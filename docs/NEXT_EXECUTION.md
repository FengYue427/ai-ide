# 当前执行清单

> **当前世代**：**v1.1.3** ✅ GA（协作 M1）  
> **下一世代**：**v1.1.4** / **v1.2**（AI 网关）  
> **生产**：https://ai-ide-flame.vercel.app

---

## v1.1.3 GA 完成（2026-05-29）

- F1～F5 代码与文档 ✅
- `v1.1.3` tag + deploy ✅（见下方运维）

### 生产启用协作 M1（按需）

1. Vercel：`VITE_COLLAB_M1_SIGNAL=true`
2. `npx prisma migrate deploy`（生产 DATABASE_URL）
3. 可选：`COLLAB_SIGNALING_URL` / `LIVEKIT_*`
4. 手测：[COLLAB_M1_SMOKE.md](./COLLAB_M1_SMOKE.md)

---

## 下一优先

| 选项 | 文档 |
|------|------|
| **v1.2 AI 网关** | [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |
| **v1.1.4** 抛光 / i18n | [ROADMAP_V1.1.x.md](./ROADMAP_V1.1.x.md) |

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [RELEASE_NOTES_v1.1.3.md](./RELEASE_NOTES_v1.1.3.md) | 对外发布说明 |
| [V1.1.3_GA_EXECUTION.md](./V1.1.3_GA_EXECUTION.md) | DoD |
| [V1.1.3_ENV.md](./V1.1.3_ENV.md) | 环境变量 |
| [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) | 协作 F1～F5 |
