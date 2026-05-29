# Release Notes — v1.1.3（协作 M1）

**日期**：2026-05-29 · **类型**：大更新（轨道 B）

---

## 亮点

- **服务端协作房间**：登录后创建 8 位邀请码、`?room=` 链接加入
- **稳定重连**：`CollaborationService` 状态机 + 退避重连（≈30s），断线保留 Y.Doc
- **角色权限**：host / editor / viewer；viewer 编辑器只读 + Host 改角色 / 踢人
- **可选 Livekit**：配置 `LIVEKIT_*` 后 API 签发 JWT（客户端仍 Yjs/WebRTC 为主路径）

---

## 开启

生产默认 **`VITE_COLLAB_M1_SIGNAL=false`**。启用时在 Vercel 设置：

```env
VITE_COLLAB_M1_SIGNAL=true
# 可选自建信令
COLLAB_SIGNALING_URL=wss://your-signaling.example
# 可选 Livekit
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

并执行 `npx prisma migrate deploy`（`CollaborationRoom` / `CollaborationMember` 表）。

---

## 限制

- 非 OT/CRDT 级逐字同步；冲突为最后写入 + 人工协调
- viewer 只读为 UI + Yjs 不写；恶意客户端可绕过（M1 非密码学级）
- Host 改角色后对方需重新加入才生效（无实时角色广播）
- AI 网关推迟至 **v1.2**

见 [V1.1.3_GA_EXECUTION.md §3](./V1.1.3_GA_EXECUTION.md#3-已知限制release-必写)。

---

## 文档

- [V1.1.3_ENV.md](./V1.1.3_ENV.md)
- [COLLAB_M1_RECONNECT.md](./COLLAB_M1_RECONNECT.md)
- [COLLAB_M1_PERMISSIONS.md](./COLLAB_M1_PERMISSIONS.md)
- [COLLAB_M1_SMOKE.md](./COLLAB_M1_SMOKE.md)
- [CHANGELOG.md](../CHANGELOG.md#113--2026-05-29协作-m1)

---

## 测试

```bash
npm run test:local
npm run test:e2e:collab    # 双浏览器 smoke（需 DB + migrate）
npm run smoke:report       # 生产 health
```
