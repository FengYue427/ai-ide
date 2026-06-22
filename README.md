# ⚡ AI IDE

开源 AI 原生轻量 IDE：**浏览器开箱** + **Electron 桌面**，以 **Plan → Spec → 队列 → 报告** 为核心工作流。

**当前版本：v1.7.0** · [CHANGELOG](./CHANGELOG.md) · [国内 P0 清单](./docs/CN_LAUNCH_P0.md) · [阿里云部署](./docs/DEPLOY_ALIYUN_CN.md)

| 入口 | 链接 |
|------|------|
| 在线体验 | https://ai-ide-flame.vercel.app |
| Releases / 桌面包 | https://github.com/FengYue427/ai-ide/releases |
| 问题反馈 | https://github.com/FengYue427/ai-ide/issues |

## 核心能力

- **Plan / Spec**：多计划目录、Spec Studio 模板、双队列执行、`.aide/reports` 可恢复 → [快速上手](./docs/PLAN_SYSTEM_QUICKSTART.md)
- **Agent**：多文件改造、Diff 预览应用、MCP 工具桥、Plan Mode
- **编辑器**：Monaco、Tab++ 补全、全局检索、WebContainer 终端（浏览器）/ 原生 PTY（桌面）
- **云端分享**：`POST /api/shares` · 链接 `?share=<slug>` 跨浏览器恢复
- **订阅**：国内 Pro **¥39** / Team **¥79**（支付宝）· 平台 AI + BYOK
- **桌面壳**：OAuth / 支付 `ai-ide://` 回跳 · 离线 UI + 远程 API

生产默认关闭：协作 M1、后台 Agent UI（见 [ENV_PRODUCTION.md](./docs/ENV_PRODUCTION.md)）。

## 快速开始

```bash
npm install
npm run dev:stack    # API :3001 + 前端 :3000
```

带数据库：`cp .env.local.example .env.local` → `npm run db:neon` → `npm run dev:stack`

## 测试与发布

```bash
npm run test:local
npm run check:release
npm run deploy                    # Vercel 生产
npm run smoke:production -- https://ai-ide-flame.vercel.app
```

发布流程：[RELEASE_RUNBOOK.md](./docs/RELEASE_RUNBOOK.md)

## 部署

| 场景 | 文档 |
|------|------|
| Vercel + Neon（当前） | `npm run build:deploy && npm run deploy` |
| 阿里云备案 + RDS | [DEPLOY_ALIYUN_CN.md](./docs/DEPLOY_ALIYUN_CN.md) · `npm run aliyun:deploy -- --with-env` |
| 环境变量 | [ENV_PRODUCTION.md](./docs/ENV_PRODUCTION.md) |
| 监控 / Cron / Sentry | [OBSERVABILITY.md](./docs/OBSERVABILITY.md) |

桌面便携版：

```bash
npm run electron:pack:offline
# 产物 release/AI-IDE-*-win-portable.exe
```

## 文档导航

- [CN_LAUNCH_P0.md](./docs/CN_LAUNCH_P0.md) — 迁阿里云前必做
- [PLAN_SYSTEM_QUICKSTART.md](./docs/PLAN_SYSTEM_QUICKSTART.md)
- [RELEASE_RUNBOOK.md](./docs/RELEASE_RUNBOOK.md)
- [ENV_PRODUCTION.md](./docs/ENV_PRODUCTION.md)
- [OBSERVABILITY.md](./docs/OBSERVABILITY.md)
- [DEPLOY_ALIYUN_CN.md](./docs/DEPLOY_ALIYUN_CN.md)

## License

MIT
