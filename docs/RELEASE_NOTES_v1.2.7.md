# Release Notes — v1.2.7 导航 E2E · Payload 对齐 · 插件/平台运维

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.6

---

## 一句话

**跨文件 F12 E2E 回归**、**Chat payload 语义/工具轮次预留与 @ 重名阻断**、**设置页插件运维与用量 80% 告警** — 工程深度，无营销 rollout。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **跨文件导航 E2E** | `main.ts` → `lib/greet.ts` 语义跳转；命令面板 / Monaco harness 回归 |
| **Payload 对齐** | 语义检索 +8KB、Agent 工具轮次 +16KB 计入表计；重名 `@` 阻断发送 |
| **插件运维** | 设置 → 功能 · 插件运维卡：`publishEnabled` / `officialKeyConfigured` |
| **发布审核** | `GET /api/plugins/publish/reviews`（内存队列，冷启动清空） |
| **平台用量** | 日配额 ≥80% 黄条；`platformProvider`（deepseek/openai）只读展示 |

---

## 部署说明

| 项 | 建议 |
|----|------|
| 客户端 | 继承 v1.2.6 生产多根默认；无新增必开 `VITE_*` |
| `PLUGIN_PUBLISH_ENABLED` | 内测作者可选 `true`；配合 `PLUGIN_OFFICIAL_PUBLIC_KEY` |
| API | 新路由 `GET /api/plugins/publish/reviews`；Redeploy 后 health 不变 |

详见 [VERCEL_V1.2_PRODUCTION_ENV.md](./VERCEL_V1.2_PRODUCTION_ENV.md) · [V1.2.7_F3_PLUGIN_PLATFORM.md](./V1.2.7_F3_PLUGIN_PLATFORM.md)

---

## 验证

```bash
npm run test:local          # 649 tests
npm run test:e2e:local      # 含 ts-cross-file-navigation · plugin-ops
npm run test:e2e:stack
npm run test:integration:local   # publish reviews 冒烟（需 PLUGIN_PUBLISH_ENABLED）
```

---

## 文档

- [V1.2.7_KICKOFF.md](./V1.2.7_KICKOFF.md)
- [V1.2.7_F1_NAV_E2E.md](./V1.2.7_F1_NAV_E2E.md)
- [V1.2.7_F2_PAYLOAD_PARITY.md](./V1.2.7_F2_PAYLOAD_PARITY.md)
- [V1.2.7_F3_PLUGIN_PLATFORM.md](./V1.2.7_F3_PLUGIN_PLATFORM.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
