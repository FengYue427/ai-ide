# v1.2.0 全方位上架手册

> **站点**：https://ai-ide-flame.vercel.app  
> **版本**：`1.2.0` · tag `v1.2.0`  
> **Release**：[RELEASE_NOTES_v1.2.0.md](./RELEASE_NOTES_v1.2.0.md) · **对外稿**：[ANNOUNCEMENT_v1.2.0.md](./ANNOUNCEMENT_v1.2.0.md)

---

## 当前状态（自动核对）

| 项 | 期望 | 如何验证 |
|----|------|----------|
| `main` 含 release 提交 | `5feb6c2` 或更新 | `git log -1` |
| 远程 tag | `v1.2.0` | `git ls-remote --tags origin v1.2.0` |
| 生产 `/api/health` | `version: 1.2.0` · `database: connected` | `npm run smoke:production` |
| 功能开关默认 | **关**（与 v1.1.9 行为一致） | 生产构建未设 `VITE_MULTI_ROOT` 等 |

---

## 阶段 A — 代码与 CI（发版前）

```powershell
cd C:\Users\18663\IDE\ai-ide
npm run test:local          # 573+ 单测
npm run build               # 前端
npm run build:api           # api/index.js（改 lib/api 后必跑）
npm run test:e2e            # UI E2E（含 v1.2 multi-root / plugin-market）
# 可选全栈门禁
npm run p0:gate             # 单测 + integration-api + security-baseline
```

| # | 检查项 | 通过 |
|---|--------|:----:|
| A1 | `tsc` 无错误 | ☐ |
| A2 | Vitest 全绿 | ☐ |
| A3 | Playwright `ui` 全绿 | ☐ |
| A4 | `api/index.js` 已提交（与 `lib/api` 一致） | ☐ |
| A5 | GitHub Actions `main` CI 绿 | ☐ |

---

## 阶段 B — Vercel 生产环境

详见 [VERCEL_V1.2_PRODUCTION_ENV.md](./VERCEL_V1.2_PRODUCTION_ENV.md) · 基线 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)

### B1 必填（已有则跳过）

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon pooler + `sslmode=require` |
| `AUTH_SECRET` | 32+ 随机，勿与本地相同 |
| `APP_URL` | `https://ai-ide-flame.vercel.app` |

### B2 勿在生产开启（安全）

- `VITE_ALLOW_OFFLINE_AUTH`
- `ALLOW_DEV_BILLING`
- `ALIPAY_SANDBOX`（收款时）

### B3 v1.2 可选（建议分阶段开启）

| 变量 | 建议节奏 | 说明 |
|------|----------|------|
| `VITE_MULTI_ROOT` | 稳定 1 周后 | 多根工作区 |
| `VITE_PLUGIN_TRUST_MARKET` | 与目录审核同步 | 市场安装门控 |
| `VITE_VIRTUAL_FILE_TREE` | 可随 multi-root 开 | 大仓虚拟列表 |
| `PLUGIN_PUBLISH_ENABLED` | 内测作者先行 | `POST /api/plugins/publish` |
| `PLUGIN_OFFICIAL_PUBLIC_KEY` | 与仓库公钥一致 | 服务端签名校验 / health |

**Redeploy**：改 Production 环境变量后必须在 Vercel **Redeploy** 一次。

---

## 阶段 C — 部署与冒烟

```powershell
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run smoke:production -- $env:APP_URL
npm run smoke:report
# 报告 → docs/PRODUCTION_SMOKE_LAST.md
```

| # | 检查 | 期望 |
|---|------|------|
| C1 | health | `v=1.2.0` · `ok` · `db=connected` |
| C2 | session | 200 · 匿名可访问 |
| C3 | workspaces | 401 未登录 |
| C4 | index | 200 |
| C5 | `/signup` | 200 · 含注册文案 |
| C6 | 注册 → 登录 → 云工作区保存 | 人工 10 分钟 |

---

## 阶段 D — 功能验收（v1.2）

本地开启后验收（见 [V1.2_ENV.md](./V1.2_ENV.md)）：

```powershell
# .env.local
VITE_MULTI_ROOT=true
VITE_PLUGIN_TRUST_MARKET=true
npm run dev:stack
```

| # | 场景 | 预期 |
|---|------|------|
| D1 | 添加第二工作区根 | 切换不串文件 |
| D2 | 插件市场安装 Hello 沙箱 | 成功 + 信任徽章 |
| D3 | 大样本 300+ 文件 | 折叠/虚拟滚动可接受 |
| D4 | 协作房间 | 单写根策略符合 ADR |

E2E 已覆盖 D1/D2 子集：`e2e/multi-root.spec.ts` · `e2e/plugin-market.spec.ts`

---

## 阶段 E — GitHub Release 与对外

### E1 GitHub Release（无 `gh` CLI 时网页操作）

1. https://github.com/FengYue427/ai-ide/releases/new  
2. Choose tag：`v1.2.0`  
3. Title：`v1.2.0 — Multi-root workspace & plugin trust`  
4. Body：粘贴 [RELEASE_NOTES_v1.2.0.md](./RELEASE_NOTES_v1.2.0.md) 正文  
5. Publish release  

### E2 对外渠道

| 渠道 | 动作 | 文档 |
|------|------|------|
| GitHub Release | 见 E1 | 上 |
| README / 仓库 About | 已标 v1.2.0 | [README](../README.md) |
| 短文/社群 | 多根 + 可信插件 | [ANNOUNCEMENT_v1.2.0.md](./ANNOUNCEMENT_v1.2.0.md) |
| Issues 模板 | 可选：标注 v1.2.0 已知限制 | RELEASE_NOTES |

---

## 阶段 F — 上架后 72 小时

| 时间 | 动作 |
|------|------|
| T+0 | `smoke:report` 存档 · 确认 Vercel 无 Error 峰值 |
| T+1 | 查看 Neon 连接 · 注册/登录错误日志 |
| T+3 | 决定是否开启 `VITE_MULTI_ROOT`（小流量） |
| T+7 | 评估 `VITE_PLUGIN_TRUST_MARKET` + 官方目录 |
| 持续 | 支付宝 notify 成功率（Path B 已开则查） |

参考历史：[GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md)

---

## 一键命令摘要

```powershell
# 本地门禁
npm run test:local && npm run build && npm run build:api

# 生产冒烟（不依赖本地 DATABASE_URL）
$env:APP_URL="https://ai-ide-flame.vercel.app"
npm run smoke:production -- $env:APP_URL
npm run smoke:report

# 可选：全栈门禁（需 Docker Postgres 或 Neon 本地串）
npm run p0:gate
```

---

## 回滚

1. Vercel → Deployments → 上一稳定部署 → **Promote to Production**  
2. 或 `git revert` + push  
3. 关闭新开的 `VITE_*` 环境变量后 Redeploy  

---

## 相关索引

| 文档 | 用途 |
|------|------|
| [V1.2_GA_EXECUTION.md](./V1.2_GA_EXECUTION.md) | F6 研发勾选 |
| [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) | Neon + Vercel 通用 |
| [DEPLOY_D3_GA.md](./DEPLOY_D3_GA.md) | 收款 Path B |
| [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) | D0～D4 档位定义 |
