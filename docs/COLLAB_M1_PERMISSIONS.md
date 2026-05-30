# 协作 M1 — 权限与只读（F3）

> **状态**：已实现（v1.1.3.3）  
> **前置**：[COLLAB_M1_RECONNECT.md](./COLLAB_M1_RECONNECT.md)

---

## 角色

| 角色 | 写 Yjs / 编辑器 | 管理成员 |
|------|-----------------|----------|
| **host** | ✅ | ✅ 改角色、踢人 |
| **editor** | ✅ | ❌ |
| **viewer** | ❌ 只读 | ❌ |

---

## 客户端

- `ideStore.collaborationMemberRole`：加入房间后由 API 成员记录写入
- `collabRoleCanWrite()`：`host` / `editor` 可写；`viewer` 不可；未设置（旧版 demo）默认可写
- `useCollaborationSync` / `useFileEditor`：viewer 不向 Yjs 推送
- `Editor` + 顶栏 **只读提示条**（viewer）
- 协作面板：加入已有房间时选择 **编辑者 / 只读**；Host 见服务端成员列表与管理按钮

---

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/collab/rooms/:code` | body `{ role?: "editor" \| "viewer" }`（非 host 加入） |
| `PATCH` | `/api/collab/rooms/:code/members/:userId` | Host 设置 `editor` / `viewer` |
| `POST` | `/api/collab/rooms/:code/members/:userId/kick` | Host 移出成员（`leftAt`） |

---

## 验收

1. B 以 **viewer** 加入 → 编辑器只读，修改不同步到 A  
2. A（host）将 B 改为 **editor** → B 在约 20s 内（或切回标签页）自动获得编辑权限 ✅ **1.1.3.1**  
3. Host **踢出** B → B 收到提示并自动断开协作 ✅ **1.1.3.1**  

---

## 限制

- 文件同步仍经 **Yjs P2P**；恶意客户端可绕过 UI 写入（M1 非密码学级 enforcement）  
- Host 改角色后，对方客户端 **轮询同步**（≈20s 或回到前台立即刷新）— 见 **1.1.3.1**  
