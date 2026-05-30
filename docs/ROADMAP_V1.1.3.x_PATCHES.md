# v1.1.3.x 补丁（协作 M1 抛光）

> GA **v1.1.3** 之后的小版本，第四段 `1.1.3.1` 起。  
> **大更新规划**：[V1.1.3_MASTER_PLAN.md](./V1.1.3_MASTER_PLAN.md) · **v1.1.4**：[V1.1.4_MASTER_PLAN.md](./V1.1.4_MASTER_PLAN.md) · **长期 v1.1.x**：[ROADMAP_V1.1_LONG_HORIZON.md](./ROADMAP_V1.1_LONG_HORIZON.md)

---

## 已完成

| 版本 | 主题 | 状态 |
|------|------|------|
| **1.1.3.1** | 角色 **轮询同步** + 被踢自动离开 | ✅ |
| **1.1.3.2** | Livekit **客户端**（Yjs over data channel） | ✅ |
| **1.1.3.3** | 光标/选区 **awareness**（Monaco 远程高亮） | ✅ |
| **1.1.3.4** | 生产 **DB 迁移** + health `collabSchema` + Livekit 容错 | ✅ |
| **1.1.3.5** | **Neon HTTP** 分步创建房间（修复创建 500） | ✅ |
| **1.1.3.6** | 协作 **UX 抛光**（信令模式、错误文案、Beta/i18n） | ✅ |
| **1.1.3.7** | **角色实时同步**（Yjs `collab-member-roles` + 慢轮询兜底踢人） | ✅ |
| **1.1.3.8** | **双机 e2e** 稳定 + CI optional + Livekit 手测文档 | ✅ |
| **1.1.3.9** | 工作区 **413** 缓解（云端 autosave 裁剪） | ✅ |

**状态**：**冻结**（2026-05-30）— 仅 P0 热修；新能力进 **v1.1.4+**。

---

## 延后 backlog（非 1.1.3.x）

按 **性价比** 排序；每项 ≈ 1～3 人日，可独立发 patch。

| 版本 | 主题 | 说明 | 优先级 |
|------|------|------|:------:|
| **1.1.3.10** | 协作 **SSE 房间事件**（可选） | 权威踢人/角色，补 Yjs 断连窗口 | P2 |

**暂缓**（除非产品强需求）：

- Yjs 全文件 OT / 冲突 UI  
- 跨文件远程光标  
- 协作 + 后台 Agent 同屏  

---

## 1.1.3.6 交付摘要

| 交付 | 验收 |
|------|------|
| `CollaborationPanel` 显示 Livekit / WebRTC 信令徽章 | 已连接时可见 |
| `formatCollabApiError` 按 HTTP 状态区分房间 API 错误 | 401/403/404/5xx 文案可区分 |
| 更新 `collab.hero` / `collab.m1.limits` / Beta 文案 | 中英一致 |
| 信令断开 hint | `disconnected` 时面板提示 |

---

## 1.1.3.7 交付摘要

| 交付 | 验收 |
|------|------|
| Yjs Map `collab-member-roles`，**主持人**在 API 成功后 publish | 改角色后 ≈1s 内成员收到 Toast |
| `useCollabRoleSync` 订阅 map；轮询降为 **120s** 仅兜底踢人/成员 | 不再 20s 轮询角色 |
| 被踢：map 移除 userId → 自动 `endCollabSession` | 双端手测 |

---

## 发版

每个 patch：`npm run test:local` → `build:deploy` → commit → push → `vercel --prod`。

协作 e2e（需 DB）：`npm run test:e2e:collab`

---

## 与 v1.1.4 / v1.2 边界

| 归属 1.1.3.x | 归属 v1.1.4（B 轨里程碑） | 归属 v1.2 |
|--------------|---------------------------|-----------|
| 协作体验、Livekit、角色同步 | **编辑器深度 + i18n Phase 2 启动** | **AI 网关** |
| patch 随时 deploy | 整包 DoD 后 tag `v1.1.4` | tag `v1.2` |

**节奏**：**1.1.3.x 已冻结** → 主线 **v1.1.4 F1～F6**。
