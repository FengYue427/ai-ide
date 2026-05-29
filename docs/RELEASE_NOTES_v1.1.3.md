# Release Notes — v1.1.3（草稿）

> **状态**：开发中 · **P0 = 协作 M1**  
> **规划**：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md)

---

## 摘要

**协作 M1**：生产级协作房间、稳定信令与重连、host/editor/viewer 权限。

AI 网关推迟至 **v1.2**。

---

## 新增

- TBD（F5 前更新）

---

## 变更

- TBD

---

## 已知限制

见 [V1.1.3_GA_EXECUTION.md §3](./V1.1.3_GA_EXECUTION.md#3-已知限制release-必写)。

---

## 升级说明

| 变量 | 路线 A | 路线 B |
|------|:------:|:------:|
| Feature flag | `VITE_COLLAB_M1_SIGNAL` | `VITE_AI_GATEWAY` |
| 服务端 env | `LIVEKIT_*` 等 | `PLATFORM_*_API_KEY` |

详见 [V1.1.3_ENV.md](./V1.1.3_ENV.md)。
