# 当前执行清单

> **当前世代**：**v1.1.3** · **P0 = 协作 M1**（网关 → **v1.2**）  
> **阶段**：**F2** ✅ 重连 + leave · **下一步 F3** viewer 只读  
> **主规划**：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)

---

## 拍板记录

| 决策 | 日期 |
|------|------|
| v1.1.3 = **协作 A** | 2026-05-29 |
| AI 网关 → **v1.2** | 2026-05-29 |

---

## F1 剩余（协作）

1. `npx prisma migrate deploy`（或 `db push`）应用 `CollaborationRoom` / `CollaborationMember`
2. Vercel Preview：`VITE_COLLAB_M1_SIGNAL=true`（见 [V1.1.3_ENV.md](./V1.1.3_ENV.md)）
3. 登录后：协作面板「创建房间」→ 应得到 8 位 `code` 与 `?room=` 链接
4. 第二账号加入同一 `code` → `POST /api/collab/rooms/:code` 200
5. 勾选 [V1.1.3_GA_EXECUTION.md](./V1.1.3_GA_EXECUTION.md) F1 协作项

---

## F3（下一步）

- viewer 无法编辑：`useCollaborationSync` / Monaco 只读 + API 写校验  
- host 踢人（可选）

详见 [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md)。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) | 协作 F1～F5 |
| [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) | 网关（延后） |
| [V1.1.3_GA_EXECUTION.md](./V1.1.3_GA_EXECUTION.md) | DoD |
| [V1.1.3_ENV.md](./V1.1.3_ENV.md) | 环境变量 |
