# v1.1.x 世代总览

> **更新**：2026-05-29 — **1.1.2.8 ✅** · **v1.1.3 Kickoff 准备就绪**  
> **主规划**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) · **执行入口**：[NEXT_EXECUTION.md](./NEXT_EXECUTION.md)

---

## 1. 双轨发版（核心）

| 轨道 | 版本形态 | 何时 push / deploy | 当前 |
|------|----------|-------------------|------|
| **A · 小 patch** | `1.1.2.1`～`.8` ✅ **冻结** | 仅热修 | — |
| **B · 大更新** | **`1.1.2`** ✅、**`1.1.3`**… | **整包 DoD 后一次** | **v1.1.3 待拍板 Kickoff** |

详见 [V1.1.2_MASTER_PLAN.md §0](./V1.1.2_MASTER_PLAN.md#0-双轨发版模型必读)。

---

## 2. 里程碑表

| 对外 tag | 含义 | 轨道 | 状态 |
|----------|------|:----:|:----:|
| **v1.1.0.x** | 计划系统功能 patch | A（第四段） | ✅ |
| **v1.1.1** | 计划系统 GA | B | ✅ push |
| **1.1.1.1～.11** | GA 前/后附属 | A | ✅ 本地 |
| **v1.1.2** | 后台 Agent MVP | **B** | ✅ GA 就绪 |
| **1.1.2.5～.8** | 后台 Agent 加深 | A | ✅ 冻结 |
| **v1.1.3** | **协作 M1** | **B** | 🟡 F1 [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) |
| **v1.2** | **AI 网关**（原 1.1.3-B） | **B** | 📋 [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |
| **v1.1.4** | 世代收官 ~2.90 | **B** | ☐ 占位 |

---

## 3. 文档索引

| 文档 | 范围 |
|------|------|
| [ROADMAP_V1.1.0_PLAN_SYSTEM.md](./ROADMAP_V1.1.0_PLAN_SYSTEM.md) | v1.1.0.5～0.20 |
| [ROADMAP_V1.1.1.x.md](./ROADMAP_V1.1.1.x.md) | 计划系统小 patch（轨道 A） |
| **[V1.1.2_MASTER_PLAN.md](./V1.1.2_MASTER_PLAN.md)** | **v1.1.2 大更新（轨道 B）** |
| [V1.1.2_GA_EXECUTION.md](./V1.1.2_GA_EXECUTION.md) | v1.1.2 DoD |
| [ROADMAP_V1.1.2.x.md](./ROADMAP_V1.1.2.x.md) | → 已合并入主规划（留档指向） |
| [ROADMAP_V1.1.2.x_PATCHES.md](./ROADMAP_V1.1.2.x_PATCHES.md) | 1.1.2.5+ 补丁 |
| **[V1.1.3_KICKOFF.md](./V1.1.3_KICKOFF.md)** | **v1.1.3 Kickoff 准备** |
| **[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)** | **v1.1.3 决策 + F 阶段** |
| [V1.1.3_GA_EXECUTION.md](./V1.1.3_GA_EXECUTION.md) | v1.1.3 DoD |
| [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) | 路线 A：协作 |
| [ROADMAP_V1.1.3_GATEWAY.md](./ROADMAP_V1.1.3_GATEWAY.md) | 路线 B：网关 |

---

## 4. 竞品目标

| 时期 | AI IDE（估） |
|------|:------------:|
| v1.1.1 计划 GA | ~2.82 |
| **v1.1.2** 后台 Agent GA | **~2.88** |
| v1.1.4 收官 | ~2.90 |

---

## 5. 占位

- [V1.1_QUEUE_SCHEMA_STUB.md](./V1.1_QUEUE_SCHEMA_STUB.md)
- [V1.1_FEATURE_FLAGS.md](./V1.1_FEATURE_FLAGS.md)
- [V1.1_RFC_STUB.md](./V1.1_RFC_STUB.md)
