# Release Notes — v1.2.5 质量与生态 E2E

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.4 · **下一**：v1.2.6

---

## 一句话

在 v1.2.4 全栈门禁之上，补齐 **命令面板/大纲/插件市场 Playwright 冒烟、插件可信 E2E、1.2.x 发版门禁文档** — 工程深度，无营销 rollout。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **UI E2E** | `language-navigation.spec` · 转到定义/引用命令 · 大纲符号 smoke |
| **插件 E2E** | `plugin-trust.spec` · 市场 tier 徽章 · 停用/启用流程 |
| **CI 对齐** | `ROADMAP_V1.2.x_PATCHES` · `e2e-collab` 必过说明 |

---

## 部署说明

- **无需** 新开客户端生产开关
- 与 v1.2.4 相同：API 变更后 `npm run build:api` + Redeploy

---

## 验证

```bash
npm run test:local
npm run test:e2e:local
npm run test:e2e:stack
npm run test:e2e:collab
```

---

## 文档

- [V1.2.5_KICKOFF.md](./V1.2.5_KICKOFF.md)
- [V1.2.5_F1_UI_E2E.md](./V1.2.5_F1_UI_E2E.md)
- [V1.2.5_F2_PLUGIN_E2E.md](./V1.2.5_F2_PLUGIN_E2E.md)
- [V1.2.5_F3_PATCH_CI.md](./V1.2.5_F3_PATCH_CI.md)
