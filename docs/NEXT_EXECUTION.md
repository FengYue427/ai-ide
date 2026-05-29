# 当前执行清单

> **当前版本**：**v1.1.2.8**（轨道 A 已冻结）· **下一世代**：**v1.1.3**（准备就绪，待拍板）  
> **Kickoff**：[V1.1.3_KICKOFF.md](./V1.1.3_KICKOFF.md) · **主规划**：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)

---

## 双轨一览

```
轨道 A   1.1.2.1～.8 ✅ 冻结
轨道 B   v1.1.2 ✅  ·  v1.1.3 ☐ 待拍板 → F1 开工
```

---

## 立即可做：v1.1.3 Kickoff

### 步骤 1 — 拍板（阻塞代码）

1. 阅读 [V1.1.3_KICKOFF.md §2](./V1.1.3_KICKOFF.md#2-必须先拍板p0-二选一) 决策矩阵  
2. 在 [V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md) §0 填写 **最终决策（A 或 B）**  
3. 更新 [V1.1.3_GA_EXECUTION.md](./V1.1.3_GA_EXECUTION.md) 顶部 P0 路线  

### 步骤 2 — F1 开工（拍板后）

| 若选 **协作 A** | 若选 **网关 B** |
|----------------|----------------|
| [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) F1 | [ROADMAP_V1.1.3_GATEWAY.md](./ROADMAP_V1.1.3_GATEWAY.md) F1 |
| 房间 API + [V1.1.3_SCHEMA_DRAFT.md](./V1.1.3_SCHEMA_DRAFT.md) | `lib/api/aiGateway/` + `POST /api/ai/chat` |
| Livekit / WS env | `PLATFORM_*_API_KEY` |

环境：[V1.1.3_ENV.md](./V1.1.3_ENV.md)

---

## v1.1.2.x 摘要（已交付）

| patch | 内容 |
|-------|------|
| .1～.4 | 通知、IDE 应用、Plan 桥接、重试/筛选/回填 |
| .5～.6 | 真 Agent Worker、Cron 可观测 |
| .7～.8 | Plan 批量后台、通知/复制/列表重试 |

详见 [ROADMAP_V1.1.2.x_PATCHES.md](./ROADMAP_V1.1.2.x_PATCHES.md)（**已冻结**）。

---

## v1.1.3 摘要（待选 P0）

| 路线 | 文档 | 一句话 |
|------|------|--------|
| **协作 M1** | [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) | 房间 + 重连 + 权限 |
| **AI 网关** | [ROADMAP_V1.1.3_GATEWAY.md](./ROADMAP_V1.1.3_GATEWAY.md) | 无 Key Pro Chat + 平台额度 |

**建议默认**：变现优先 → **网关 B**；演示/协作叙事 → **协作 A**。

---

## v1.1.2 基线（生产）

| 项 | 说明 |
|----|------|
| URL | https://ai-ide-flame.vercel.app |
| 后台 Agent | `VITE_BACKGROUND_AGENT` + `CRON_SECRET` |
| Worker | `dummy` 默认；`agent` 需 `BACKGROUND_AGENT_API_KEY` |
| Cron | Hobby 每日 `0 4 * * *` |

见 [BACKGROUND_AGENT_QUICKSTART.md](./BACKGROUND_AGENT_QUICKSTART.md)。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [V1.1.3_KICKOFF.md](./V1.1.3_KICKOFF.md) | Kickoff 准备 |
| [V1.1.3_GA_EXECUTION.md](./V1.1.3_GA_EXECUTION.md) | v1.1.3 DoD |
| [V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md) | 决策与 F 阶段 |
| [ROADMAP_V1.1.x.md](./ROADMAP_V1.1.x.md) | 世代总览 |
| [V1.1.2_GA_EXECUTION.md](./V1.1.2_GA_EXECUTION.md) | v1.1.2 DoD（已完成） |
