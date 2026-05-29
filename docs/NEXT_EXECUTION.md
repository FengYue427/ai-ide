# 当前执行清单

> **当前版本**：**v1.1.2.4**（轨道 A 已交付）· **CI** ✅ integration-api + e2e-stack  
> **建议下一 patch**：**1.1.2.5** 真 Agent Worker  
> **下一世代**：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)（协作 **或** 网关，二选一）

---

## 双轨一览

```
轨道 A   1.1.2.1～.4 ✅  │  1.1.2.5～.8 📋 规划
轨道 B   v1.1.2 ✅ 已部署  │  v1.1.3 ☐ 待拍板 Kickoff
```

---

## 立即可做

### 选项 1 — 继续后台线（推荐）

1. 阅读 [ROADMAP_V1.1.2.x_PATCHES.md](./ROADMAP_V1.1.2.x_PATCHES.md) §1.1.2.5  
2. 实现 `runAgentBackgroundJob`（云工作区 + Agent 循环）  
3. `package.json` → `1.1.2.5`，patch 发版  

### 选项 2 — 开 v1.1.3

1. 在 [V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md) §0 **选定协作或网关**  
2. 创建 `V1.1.3_GA_EXECUTION.md`  
3. 从对应路线 F1 开工（**不要**与 1.1.2.5 并行两个 P0）

---

## v1.1.2.x 摘要（已完成 + 规划）

| patch | 内容 |
|-------|------|
| .1～.4 | 通知、IDE 应用、Plan 桥接、重试/筛选/回填 ✅ |
| **.5** | 真 Agent Worker（云）📋 |
| .6～.8 | Cron/可观测、Plan 批量后台、体验抛光 📋 |

详见 [ROADMAP_V1.1.2.x_PATCHES.md](./ROADMAP_V1.1.2.x_PATCHES.md)。

---

## v1.1.3 摘要（待选）

| 路线 | 文档 | 一句话 |
|------|------|--------|
| **协作 M1** | [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) | 房间 + 重连 + 权限 |
| **AI 网关** | [ROADMAP_V1.1.3_GATEWAY.md](./ROADMAP_V1.1.3_GATEWAY.md) | 无 Key Pro Chat + 平台额度 |

主规划：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)

---

## v1.1.2 基线（已部署）

| 阶段 | 内容 |
|------|------|
| F1～F5 | 后台 Agent MVP — 见 [BACKGROUND_AGENT_QUICKSTART.md](./BACKGROUND_AGENT_QUICKSTART.md) |

**已知限制**：Worker 默认 **dummy**；Vercel Hobby Cron **每日 1 次**（见 `vercel.json` `0 4 * * *`）。

---

## 文档索引

| 文档 | 用途 |
|------|------|
| [ROADMAP_V1.1.2.x_PATCHES.md](./ROADMAP_V1.1.2.x_PATCHES.md) | 1.1.2.5+ |
| [V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md) | v1.1.3 决策与 F 阶段 |
| [ROADMAP_V1.1.x.md](./ROADMAP_V1.1.x.md) | 世代总览 |
| [V1.1.2_GA_EXECUTION.md](./V1.1.2_GA_EXECUTION.md) | v1.1.2 DoD |
