# Release Notes — v1.1.8

**主题**：平台 AI（Cursor 模式）+ 可发现注册 + 调试抛光  
**版本**：`1.1.8`  
**建议 tag**：`v1.1.8`

---

## 面向用户

### 平台 AI（无需自备 API Key）

- 注册并登录后，在 **设置 → AI 接入方式** 选择 **平台 AI**
- Chat 与 **Agent 工具循环** 经服务端转发，计入每日配额
- 仍可切换 **自带 API Key（BYOK）**

### 注册与发现

- 独立页面：**/signup**、**/login**（利于搜索与分享）
- IDE 内：`?auth=register` 打开注册弹窗
- 欢迎页：**免费注册并开始** CTA（需 `VITE_AI_GATEWAY=true`）

### 调试（1.1.7.x patch 合入）

- **桌面版**：绑定本地文件夹后，原生 `node --inspect-brk` attach
- **稳定性**：断点多 URL 匹配、CDP 断开自动清理会话、连接重试

---

## 面向运维

| 变量 | 说明 |
|------|------|
| `VITE_AI_GATEWAY=true` | 前端显示平台/BYOK 切换 |
| `PLATFORM_DEEPSEEK_API_KEY` | 平台 Chat/Agent 上游 |
| `GET /api/health` | 新增 `platformAi.configured` |

---

## 已知限制

- Tab 补全、嵌入检索仍走 BYOK（后续 patch）
- 平台 Agent 上游目前以 **DeepSeek/OpenAI 兼容** 为主
- SEO 收录需 deploy 后提交 Search Console

---

## 升级自 v1.1.7

1. 配置平台 Key 与 `VITE_AI_GATEWAY`
2. Deploy 后验证 `/signup` 与无 Key Chat
3. 桌面用户验证本地文件夹调试
