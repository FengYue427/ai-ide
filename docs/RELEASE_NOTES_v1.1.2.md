# Release Notes — v1.1.2（后台 Agent MVP）

**日期**：2026-05-29 · **类型**：大更新（轨道 B）

---

## 亮点

- **关页继续跑**：服务端 `BackgroundJob` + Cron Worker，任务状态持久化
- **Chat「后台运行」**：Agent 上下文提交到 `/api/jobs`
- **后台任务面板**：列表、详情、5s 轮询、取消
- **云工作区回写**：成功后将 `pendingChanges` 合并到云工作区；IDE **预览 Diff**
- **Pro 门禁**：Free 每日 2 次 / 同时 1 个；Pro+ 更高配额

---

## 开启

生产默认 **`VITE_BACKGROUND_AGENT=false`**。启用时在 Vercel 设置：

```env
VITE_BACKGROUND_AGENT=true
CRON_SECRET=...
```

并执行 `prisma migrate deploy`。

---

## 限制

见 [V1.1.2_GA_EXECUTION.md §2](./V1.1.2_GA_EXECUTION.md#2-已知限制release-必写) 与 [BACKGROUND_AGENT_QUICKSTART.md §6](./BACKGROUND_AGENT_QUICKSTART.md#6-已知限制ga)。

---

## 文档

- [BACKGROUND_AGENT_QUICKSTART.md](./BACKGROUND_AGENT_QUICKSTART.md)
- [V1.1.2_GA_EXECUTION.md](./V1.1.2_GA_EXECUTION.md)
- [CHANGELOG.md](../CHANGELOG.md#112--2026-05-29后台-agent-mvp)
