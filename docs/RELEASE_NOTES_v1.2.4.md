# Release Notes — v1.2.4 Agent/索引/E2E

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.3

---

## 一句话

在 v1.2.3 产品深度之上，补齐 **转到引用、Agent 上下文预算与 @ 预检、全栈 E2E 必过** — 工程深度优先，宣传/上架仍搁置。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **转到引用** | 命令面板 / Shift+F12 · 跨文件引用 · 大纲作用域 `Class.method` |
| **Agent 上下文** | 聊天区 payload 预算条 · `@` 预检（未解析/超限/重名）· 大仓索引 capped 提示 |
| **全栈 E2E** | 注册 → 云端工作区保存 → 列表校验 · CI `e2e-stack` 阻塞 |

---

## 部署说明

- **无需** 新开生产功能开关
- 改 `lib/api` 后：`npm run build:api` · Redeploy Vercel Production

---

## 验证

```bash
npm run test:local
npm run test:e2e
npm run test:e2e:stack          # 需 Postgres + db:seed
npm run test:integration:local
```

---

## 文档

- [V1.2.4_KICKOFF.md](./V1.2.4_KICKOFF.md)
- [V1.2.4_F1_REFERENCES.md](./V1.2.4_F1_REFERENCES.md)
- [V1.2.4_F2_AGENT_CONTEXT.md](./V1.2.4_F2_AGENT_CONTEXT.md)
- [V1.2.4_F3_FULLSTACK_E2E.md](./V1.2.4_F3_FULLSTACK_E2E.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
