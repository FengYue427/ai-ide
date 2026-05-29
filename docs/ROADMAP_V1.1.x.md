# v1.1.x 世代总览

> **更新**：2026-05-29 — **双轨发版**定稿  
> **主规划**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) · **执行入口**：[NEXT_EXECUTION.md](./NEXT_EXECUTION.md)

---

## 1. 双轨发版（核心）

| 轨道 | 版本形态 | 何时 push / deploy | 当前 |
|------|----------|-------------------|------|
| **A · 小 patch** | `1.1.1.10`～`.13`、可选 `1.1.2.x` | 做完就 push | **可与 1.1.2 一并 push** |
| **B · 大更新** | **`1.1.2`**、**`1.1.3`**… | **整包 DoD 后一次** | **1.1.2 GA 就绪** |

详见 [V1.1.2_MASTER_PLAN.md §0](./V1.1.2_MASTER_PLAN.md#0-双轨发版模型必读)。

---

## 2. 里程碑表

| 对外 tag | 含义 | 轨道 | 状态 |
|----------|------|:----:|:----:|
| **v1.1.0.x** | 计划系统功能 patch | A（第四段） | ✅ |
| **v1.1.1** | 计划系统 GA | B | ✅ push |
| **1.1.1.1～.11** | GA 前/后附属 | A | ✅ 本地 |
| **v1.1.2** | 后台 Agent MVP | **B** | ✅ GA 就绪 |
| **v1.1.3** | 协作 **或** 网关 | **B** | ☐ 占位 |
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
| [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) | v1.1.3 占位 |

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
