# 协作 M1 — 双机 Smoke（F4）

> **状态**：v1.1.3.8 加固（e2e 选择器 + CI optional job）  
> **自动化**：`npm run test:e2e:collab` · API 段在 `npm run test:integration:local`

---

## 1. 前置

```bash
npx prisma migrate deploy   # CollaborationRoom / CollaborationMember
npm run dev:stack:collab    # VITE_COLLAB_M1_SIGNAL=true
```

环境见 [V1.1.3_ENV.md](./V1.1.3_ENV.md)。

---

## 2. 自动化 Smoke

| 命令 | 覆盖 |
|------|------|
| `node scripts/integration-api-collab.mjs`（经 `integration-api.mjs`） | 创建房间、viewer 加入、403 越权、host 改角色、踢人 |
| `npm run test:e2e:collab` | **双浏览器**：Host 创建 → Viewer 只读 → 信令徽章可见 |

**CI**：`e2e-collab` job（`continue-on-error: true`，不阻塞主 CI）。

---

## 2b. Livekit 生产手测（可选）

未配置 `LIVEKIT_*` 时 e2e/CI 走 **y-webrtc**；生产验证 Livekit：

| 变量 | 说明 |
|------|------|
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | 服务端 JWT |
| `LIVEKIT_URL` | `wss://…` |
| `VITE_COLLAB_M1_SIGNAL=true` | 客户端 M1 |

**步骤**：

1. Vercel 配置上述变量并 redeploy。  
2. 双人加入同一房间，协作面板信令徽章应显示 **Livekit**。  
3. 浏览器 Console：`connected to livekit server`（区域因项目而异）。  
4. 编辑同文件，数秒内 Yjs 内容一致；光标/选区可见（1.1.3.3+）。

**VPN**：可能影响 WebRTC/Livekit 媒体路径；房间 REST **500** 为服务端问题，与 VPN 无关。

---

## 3. 手工清单（≈10 分钟）

两名测试者 **A（Host）**、**B（Guest）**，各用 Chrome 普通窗口 + 隐身窗口，登录不同账号。

| # | 步骤 | 预期 | ☐ |
|---|------|------|---|
| 1 | A：命令面板 → 实时协作 → **创建房间** | 得到 8 位 `code` 与 `?room=` 链接 | |
| 2 | B：打开 A 的链接或输入 `code` → 选 **只读** → 加入 | B 显示「只读」徽章；编辑器顶栏 **只读提示** | |
| 3 | A 修改 `index.js` 并保存 | B 在数秒内看到相同内容（Yjs） | |
| 4 | B 尝试改文件 | 编辑器不可输入 / 修改不传到 A | |
| 5 | A：协作面板 → 将 B **设为编辑**；B **重新加入** | B 可编辑并同步到 A | |
| 6 | A 断网（飞行模式）10s → 恢复 | 30s 内状态回到 **已连接**（见 F2） | |
| 7 | 保持会话 **10 分钟**，偶尔编辑 | 双方仍在线；无「幽灵」空房间 | |
| 8 | A **移出** B 或 B **离开** | 服务端成员列表更新；B 只读/连接状态清除 | |

---

## 4. 验收映射（ROADMAP §4）

| 验收项 | 自动化 | 手工 |
|--------|:------:|:----:|
| A 创建、B 链接加入 | ✅ e2e | ✅ #1–2 |
| 断网 30s 内重连 | — | ✅ #6 |
| viewer 无法修改 | ✅ e2e banner + API | ✅ #4 |
| 10min 无幽灵 | — | ✅ #7 |

---

## 5. 失败排查

| 现象 | 检查 |
|------|------|
| 创建房间 500 | `prisma migrate deploy`、DATABASE_URL |
| 仍走旧 WebRTC demo | `VITE_COLLAB_M1_SIGNAL=true`（`.env.collab-e2e` 或 Vercel） |
| 双机不同步 | 信令 `COLLAB_SIGNALING_URL`、防火墙、WebRTC 被扩展拦截 |
| e2e 超时 | 本地先 `npm run dev:stack:collab` 确认 3000 可访问 |
