# Release Notes — v1.2.3 产品深度

> **日期**：2026-06-04  
> **站点**：https://ai-ide-flame.vercel.app  
> **上一稳定版**：v1.2.2

---

## 一句话

在 Workbench Shell 之上补齐 **编辑导航、Tab 补全、平台 AI 运维与协作 E2E** — 工程深度优先，宣传/上架仍搁置。

---

## 用户可见变化

| 主题 | 说明 |
|------|------|
| **转到定义** | 命令面板 / F12 · `languageServiceHost` 统一跨文件跳转 |
| **多根工作区** | Dev 默认多根 + 虚拟文件树 · 删根清理 autosave |
| **Tab 补全** | FIM → 平台 AI → 对话回退 · 设置页路径/延迟/统计 |
| **平台用量** | 设置 → AI · 7 日柱状图与估算成本（只读） |
| **协作** | Collab E2E 与重连单测加固 · CI 必过 |

---

## 部署说明

- **无需** 新开生产功能开关（`VITE_MULTI_ROOT` 等仍默认关；`npm run dev` 本地默认开）
- 改 `lib/api` 后：`npm run build:api` · Redeploy Vercel Production

---

## 验证

```bash
npm run test:local
npm run test:e2e
npm run test:integration:local   # 需 DATABASE_URL
npm run test:e2e:collab            # 需 Postgres
```

---

## 文档

- [V1.2.3_KICKOFF.md](./V1.2.3_KICKOFF.md)
- [V1.2.3_F2_MULTI_ROOT.md](./V1.2.3_F2_MULTI_ROOT.md)
- [V1.2.3_F3_TAB_COMPLETION.md](./V1.2.3_F3_TAB_COMPLETION.md)
- [V1.2.3_F4_PLATFORM_USAGE.md](./V1.2.3_F4_PLATFORM_USAGE.md)
- [V1.2.3_F5_COLLAB_E2E.md](./V1.2.3_F5_COLLAB_E2E.md)
- [NEXT_EXECUTION.md](./NEXT_EXECUTION.md)
