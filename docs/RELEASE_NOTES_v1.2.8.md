# Release Notes — v1.2.8 引用 Peek · MCP 表计 · 插件发布持久化

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.7

---

## 一句话

**跨文件引用 E2E + ReferencesPeekBar**、**Agent MCP payload 预留与重名 @ 精简发送**、**PluginPublishReview Prisma 队列与 Manual 提交审核** — 工程深度，无营销 rollout。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **引用** | `lib/greet.ts` 上 Shift+F12 / 转到引用 → `ReferencesPeekBar` 或 Monaco peek；可点击跳转 `main.ts` |
| **Chat 表计** | Agent + 已启用 MCP 时 +6KB 预留；表计脚注「含 MCP 工具段预留」 |
| **重名 @** | 仅符号重名时显示 **精简发送**（`forceSlim`，跳过阻断） |
| **插件发布** | 插件管理器 Manual → **提交审核**；`reviewId` 展示；设置页 reviews 列表优先读 DB |
| **运维** | [PLUGIN_TRUST_PRODUCTION.md](./PLUGIN_TRUST_PRODUCTION.md)：`migrate deploy` · `PLUGIN_PUBLISH_ENABLED` · `VITE_PLUGIN_TRUST_MARKET` |

---

## 部署说明

| 项 | 建议 |
|----|------|
| 数据库 | `npx prisma migrate deploy`（`PluginPublishReview` 表） |
| `PLUGIN_PUBLISH_ENABLED` | 作者内测 `true`；`POST` 写 DB + 内存回退 |
| `GET /api/plugins/publish/reviews` | 有 DB 时冷启动仍可列出历史提交 |
| 客户端 | 无新增必开 `VITE_*`；信任市场仍见 v1.2.6 开关文档 |

详见 [VERCEL_V1.2_PRODUCTION_ENV.md](./VERCEL_V1.2_PRODUCTION_ENV.md) · [PLUGIN_TRUST_PRODUCTION.md](./PLUGIN_TRUST_PRODUCTION.md)

---

## 验证

```bash
npm run test:local          # 650 tests
npm run test:e2e:local      # 含 ts-cross-file-navigation 引用用例
npm run test:e2e:stack
npm run test:integration:local   # publish + DB 行（需 DATABASE_URL + PLUGIN_PUBLISH_ENABLED）
```

---

## 文档

- [V1.2.8_KICKOFF.md](./V1.2.8_KICKOFF.md)
- [V1.2.8_F1_REFERENCES_UI.md](./V1.2.8_F1_REFERENCES_UI.md)
- [V1.2.8_F2_AGENT_MCP.md](./V1.2.8_F2_AGENT_MCP.md)
- [V1.2.8_F3_PLUGIN_PUBLISH.md](./V1.2.8_F3_PLUGIN_PUBLISH.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
