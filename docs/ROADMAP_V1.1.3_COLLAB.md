# v1.1.3 路线 A — 协作 M1（信令稳定）

> **状态**：**P0 执行中** · F1 已起步（房间 API + Prisma）  
> **现状**：`CollaborationPanel` + `collaborationService`；M1 开关 `VITE_COLLAB_M1_SIGNAL` 走 `/api/collab/rooms`

---

## 1. 一句话

**两人（或小队）加入同一房间**，稳定连接与重连；**host/editor/viewer** 权限；**非** OT 级合并。

---

## 2. 范围

### 做

| 项 | 说明 |
|----|------|
| 房间 API | `POST /api/collab/rooms`、`JOIN`、token |
| 信令 | 托管 SFU（推荐 Livekit）或自建 WS |
| 客户端 | 重构 `collaborationService`：重连、状态机 |
| 权限 | host 踢人、editor 写、viewer 只读 |
| 文档 | 冲突策略（最后写入 wins + 人工协调） |

### 不做

- 光标/选区同步（可 v1.1.3.x）  
- CRDT/Yjs 全文件 OT  
- 后台 Agent 与协作同屏耦合  

---

## 3. 阶段 F1～F5

| 阶段 | 交付 | 估时 |
|------|------|------|
| **F1** | 选型 + 房间 CRUD API + env 文档 | 3～5d · **进行中** |
| **F2** | `collaborationService` 重连 + 房间生命周期 | 7～10d |
| **F3** | 权限模型 UI + API 校验 | 5d |
| **F4** | 双机 10min 手工 + 自动化 smoke（2 browser） | 3d |
| **F5** | GA 文档、feature flag 默认 off → 生产 on | 2～3d |

**内部 patch 映射**：F1→1.1.3.1 … F5→1.1.3.5

---

## 4. 验收

- [ ] A 创建房间，B 通过链接加入  
- [ ] 断网 30s 内重连恢复房间  
- [ ] viewer 无法修改文件（或修改被拒绝）  
- [ ] 10min 会话无房间幽灵（双方仍在线）  

---

## 5. 依赖

```env
# 示例（Livekit）
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
VITE_COLLAB_SIGNALING=true
```

Prisma：新增 `CollaborationRoom`、`RoomMember`（Kickoff 时写 migration 草案）。

---

## 6. 与现有 Beta 关系

保留现有 WebRTC 数据通道作 **fallback/demo**；M1 以 **托管信令** 为主路径，避免继续依赖公共 STUN 演示环境。
