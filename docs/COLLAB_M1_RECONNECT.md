# 协作 M1 — 重连与房间生命周期（F2）

> **状态**：已实现（v1.1.3.2 内部里程碑）  
> **前置**：F1 房间 API + `VITE_COLLAB_M1_SIGNAL`

---

## 客户端

`CollaborationService` 连接状态机：

| 状态 | 含义 |
|------|------|
| `idle` | 未加入 |
| `connecting` | 首次连接信令 |
| `connected` | WebRTC 已连通 |
| `reconnecting` | 断线后退避重连 |
| `disconnected` | 主动离开或放弃 |

- 退避间隔：`1s → 2s → 4s → 8s → 15s`（合计约 30s，满足验收「断网 30s 内重连」）
- 重连时 **保留同一 `Y.Doc`**，仅重建 `WebrtcProvider`
- `window.online` 与 `visibilitychange`（回到前台）触发 `tryReconnect()`
- 加入时优先使用 API 返回的 `room.signaling.signalingUrls` 与 `roomChannel`

UI：`CollaborationPanel` 显示连接状态与成员角色；离开房间时调用 `POST /api/collab/rooms/:code/leave`。

---

## 服务端

| 端点 | 说明 |
|------|------|
| `POST /api/collab/rooms/:code/leave` | 成员 `leftAt` 标记离开 |

信令环境变量：

```env
# Yjs WebRTC（默认公共信令，生产请自建）
COLLAB_SIGNALING_URL=wss://your-signaling.example
# 或逗号分隔多节点
COLLAB_SIGNALING_URLS=wss://a.example,wss://b.example

# 可选 Livekit（配置后 API 返回 livekitToken；客户端仍走 y-webrtc 直至 F4+）
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

客户端可选覆盖：

```env
VITE_COLLAB_SIGNALING_URL=wss://your-signaling.example
```

---

## 手测清单

1. A 创建房间，B 通过 `?room=` 加入 → 双方状态 `connected`
2. A 断网 10s 再恢复 → 30s 内回到 `connected`，文件 map 仍在
3. A 点击离开 → B 仍在线；A 再次加入需重新 join API
4. 配置 `LIVEKIT_*` 后 join 响应含 `signaling.mode: livekit` 与 `livekitToken`（JWT 字符串）

---

## 后续（F3）

- viewer 角色：编辑器只读 + API 拒绝写操作  
- host 踢人（可选）
