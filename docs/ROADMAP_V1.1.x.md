# v1.1.x 世代总览

> **更新**：2026-05-29 — **v1.1.6 GA ✅** · **1.1.6.x 1.1.6.1～.4 ✅** · **v1.1.7 规划**  
> **主规划**：[ROADMAP_V1.1.md](./ROADMAP_V1.1.md) · **长期 v1.1.5～9**：[ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) · **执行**：[NEXT_EXECUTION.md](./NEXT_EXECUTION.md)

---

## 1. 双轨发版（核心）

| 轨道 | 版本形态 | 何时 push / deploy | 当前 |
|------|----------|-------------------|------|
| **A · 小 patch** | `1.1.2.1`～`.8` ✅ **冻结** | 仅热修 | — |
| **B · 大更新** | **`1.1.2`** ✅ … **`1.1.6`** ✅ | **整包 DoD 后一次** | **v1.1.7 规划（调试器）** |

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
| **v1.1.3** | **协作 M1** | **B** | ✅ GA [ROADMAP_V1.1.3_COLLAB.md](./ROADMAP_V1.1.3_COLLAB.md) |
| **1.1.3.1～.9** | 协作抛光 + e2e + 413 patch | A | ✅ **冻结** |
| **v1.1.4** | 编辑器深度 + UX + i18n Phase 2 | **B** | ✅ [RELEASE_NOTES_v1.1.4.md](./RELEASE_NOTES_v1.1.4.md) |
| **v1.1.5** | **终端 + 任务** | **B** | ✅ [RELEASE_NOTES_v1.1.5.md](./RELEASE_NOTES_v1.1.5.md) |
| **v1.1.6** | **Git 可视化** | **B** | ✅ [RELEASE_NOTES_v1.1.6.md](./RELEASE_NOTES_v1.1.6.md) |
| **v1.1.7** | **调试器 MVP** | **B** | 📋 [V1.1.7_KICKOFF.md](./V1.1.7_KICKOFF.md) |
| **v1.2** | **AI 网关** | **B** | 📋 [ROADMAP_V1.2.md](./ROADMAP_V1.2.md) |

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
| **[V1.1.4_KICKOFF.md](./V1.1.4_KICKOFF.md)** | **v1.1.4 开波 + F1** |
| **[V1.1.4_MASTER_PLAN.md](./V1.1.4_MASTER_PLAN.md)** | **v1.1.4 主规划** |
| [ROADMAP_V1.1.4.x_PATCHES.md](./ROADMAP_V1.1.4.x_PATCHES.md) | 1.1.4.x patch |
| **[V1.1.5_KICKOFF.md](./V1.1.5_KICKOFF.md)** | **v1.1.5 开波** |
| **[V1.1.5_MASTER_PLAN.md](./V1.1.5_MASTER_PLAN.md)** | **v1.1.5 主规划** |
| [ROADMAP_V1.1.5.x_PATCHES.md](./ROADMAP_V1.1.5.x_PATCHES.md) | 1.1.5.x patch（冻结） |
| **[V1.1.6_KICKOFF.md](./V1.1.6_KICKOFF.md)** | **v1.1.6 开波** |
| **[V1.1.6_MASTER_PLAN.md](./V1.1.6_MASTER_PLAN.md)** | **v1.1.6 主规划** |
| [ROADMAP_V1.1.6.x_PATCHES.md](./ROADMAP_V1.1.6.x_PATCHES.md) | **1.1.6.x patch（1.1.6.5+ 前瞻）** |
| **[V1.1.7_KICKOFF.md](./V1.1.7_KICKOFF.md)** | **v1.1.7 开波（调试器）** |
| **[V1.1.7_MASTER_PLAN.md](./V1.1.7_MASTER_PLAN.md)** | **v1.1.7 主规划** |
| [V1.1.7_GA_EXECUTION.md](./V1.1.7_GA_EXECUTION.md) | v1.1.7 DoD（待开波） |
| [ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md) | v1.1.8～1.1.9.x |
| [ROADMAP_V1.1.3.x_PATCHES.md](./ROADMAP_V1.1.3.x_PATCHES.md) | 1.1.3.x patch |

---

## 4. 竞品参照（雷达，非收官分数）

| 时期 | 说明 |
|------|------|
| v1.1.3 协作 GA | 协作轴达到可演示生产级 |
| v1.1.4+ | 各轴定性复评 → [ROADMAP_V1.1_LONG_HORIZON.md §6](./ROADMAP_V1.1_LONG_HORIZON.md) |

历史估分（~2.82～2.88）仅作内部参考，**不作为停更条件**。

---

## 5. 占位

- [V1.1_QUEUE_SCHEMA_STUB.md](./V1.1_QUEUE_SCHEMA_STUB.md)
- [V1.1_FEATURE_FLAGS.md](./V1.1_FEATURE_FLAGS.md)
- [V1.1_RFC_STUB.md](./V1.1_RFC_STUB.md)
