# MCP 官方推荐目录（1.0.4）

> **产品约束**：浏览器端仅支持 **Streamable HTTP MCP**，经 **`/api/mcp/proxy`** 转发。  
> **stdio / SSE 旧式** 服务器需在本机用适配器转为 HTTP，或使用 `npm run dev:stack` 本地栈。

---

## 预置条目（设置中心一键添加）

| ID | 名称 | 默认 URL | 说明 |
|----|------|----------|------|
| `local-dev` | 本地 dev:stack | `http://127.0.0.1:3001/mcp` | 需 `npm run dev:stack`；Vercel 生产无法访问 localhost |
| `self-hosted` | 自建 HTTP MCP | （空，手填） | 部署在你控制的 HTTPS 端点 |
| `community` | 社区目录 | （空，手填） | 从 [Smithery](https://smithery.ai/) 等选取 **HTTP** 兼容服务 |

添加后请点击 **测试**，确认返回「已连接」或工具列表。

---

## 连通步骤

1. 打开 **设置 → MCP 服务器**。
2. 在 **官方推荐** 区点击对应预置 → 自动填入名称与 URL 模板。
3. 按你的环境修改 URL（HTTPS、路径、鉴权头若需要）。
4. 点击 **保存**（设置页统一保存）→ **测试**。
5. 在 Chat 开启 Agent，模型可输出 `<<<mcp-tool>>>` 块调用工具（需启用服务器）。

---

## 生产 smoke

```powershell
npm run dev:stack
# 浏览器打开设置，测试 local-dev 预置
```

公网 endpoint：在 Vercel 部署下仅可访问 **公网 HTTPS** MCP；勿填 `localhost`。

---

## 故障排查（FAQ）

| 现象 | 原因 | 处理 |
|------|------|------|
| 测试失败 / 无法连接 localhost | Vercel 生产无法访问本机 | 使用 `npm run dev:stack` 本地测，或改填 **公网 HTTPS** MCP |
| 浏览器 CORS 报错 | 直连 MCP 被拦 | 必须经 **`/api/mcp/proxy`**（设置内已走代理） |
| HTTP **401** / 未登录 | 代理需登录 | 先登录账号再测试 |
| HTTP **400** Invalid URL | URL 非 http(s) 或生产填了 localhost | 检查 URL；生产见 [BROWSER_LIMITATIONS.md](./BROWSER_LIMITATIONS.md) |
| 上游 **502** | MCP 服务不可达或超时 | 确认 endpoint 在线、防火墙与 30s 超时 |

本地自动化：`npm run mcp:smoke`（可选 `MCP_SMOKE_SKIP_LIVE=1` 跳过在线探测）。

---

## 相关文档

- [V1.0.5.1_EXECUTION.md](./V1.0.5.1_EXECUTION.md)
- [V1.0.4.1_EXECUTION.md](./V1.0.4.1_EXECUTION.md)
- [PHASE_IDE4_CURSOR_PARITY.md](./PHASE_IDE4_CURSOR_PARITY.md)（竞品对照）
