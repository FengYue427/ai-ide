# Release Notes — v1.2.6 语义导航 · Agent 预检 · 生产开关

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.5（工程线）/ v1.2.4（上一 tag 基线）

---

## 一句话

**Monaco TS 语义 F12/引用**、**Chat 发送 @ 阻断与 payload 表计 reserve**、**生产环境多根/虚拟树默认开启** — 仍不做渠道宣传。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **语义导航** | TS/JS 优先 Monaco Worker 定义/引用；`file:///` 与 extra libs 对齐；失败回退启发式 |
| **Agent 预检** | 未解析 `@` 阻止发送；进度条 +12KB 预留；发送体积漂移 telemetry |
| **v1.2 生产开关** | 生产默认多根 + 虚拟文件树；设置 → 功能 · v1.2 只读状态卡 |
| **插件可信** | 仍默认关；`VITE_PLUGIN_TRUST_MARKET=true` 或 localStorage 开启 |

---

## 部署说明

| 项 | 建议 |
|----|------|
| `VITE_MULTI_ROOT` | 生产构建默认 **开**（v1.2.6）；回退设 `false` |
| `VITE_VIRTUAL_FILE_TREE` | 随 multi-root；可单独 `false` |
| `VITE_PLUGIN_TRUST_MARKET` | 与官方目录同步前保持 `false` |
| API | 无破坏性变更；常规 Redeploy |

详见 [V1.2_ENV.md](./V1.2_ENV.md) · [V1.2.6_F3_PROD_FLAGS.md](./V1.2.6_F3_PROD_FLAGS.md)

---

## 验证

```bash
npm run test:local          # 639 tests
npm run test:e2e:local
npm run test:e2e:stack
```

---

## 文档

- [V1.2.6_KICKOFF.md](./V1.2.6_KICKOFF.md)
- [V1.2.6_F1_TS_NAVIGATION.md](./V1.2.6_F1_TS_NAVIGATION.md)
- [V1.2.6_F2_AGENT_PREFLIGHT.md](./V1.2.6_F2_AGENT_PREFLIGHT.md)
- [V1.2.6_F3_PROD_FLAGS.md](./V1.2.6_F3_PROD_FLAGS.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
