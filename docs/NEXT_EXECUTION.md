# 当前执行清单

> **主线**：先把 **v1.0.3 GA** 跑通，再按计划进入 **1.0.3.x 四级**。  
> [V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md) · [V1.0.3_RC.md](./V1.0.3_RC.md) · **[ROADMAP_V1.0.3.x.md](./ROADMAP_V1.0.3.x.md)**（GA 后）

---

## A. v1.0.3 GA 前置（顺序建议）

### A0 今日执行快照（2026-05-27）

- [x] `npm run go-live:preflight` 通过（`test:local` + `smoke:report` 5/5）
- [x] **v1.0.3.2** 已 bump + tag 推送（S1+S2 合并部署）
- [ ] Vercel 部署完成后复跑 `npm run rc:live-spotcheck`（期望 `version=1.0.3.2`）
- [ ] Vercel 人工：`VITE_SENTRY_DSN`、`CRON_SECRET`（见 [V1.0.3.1_EXECUTION.md](./V1.0.3.1_EXECUTION.md)）
- [ ] 若换自定义域：按 [V1.0.3.2_EXECUTION.md](./V1.0.3.2_EXECUTION.md) 做 OAuth/支付回归

### A1 Phase 1 收尾

- [ ] Vercel 人工核对：`APP_URL`、`AUTH_SECRET`、`DATABASE_URL` → [V1.0.3_VERCEL_ENV.md](./V1.0.3_VERCEL_ENV.md)
- [ ] `VITE_SENTRY_DSN` + 生产 release 对齐发版版本（GA 时用 `ai-ide@1.0.3`）
- [ ] `CRON_SECRET` + `billing:verify-cron` 全链路

```powershell
npm run ops:verify-p1
```

### A2 Phase 2 RC 收尾

```powershell
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
```

- [ ] 生产 redeploy → `/api/health` 的 `version` = `1.0.3-rc.1`
- [ ] [RC_LIVE_SPOTCHECK_LAST.md](./RC_LIVE_SPOTCHECK_LAST.md) 5 项人工勾选

### A3 Phase 3 GA tag

发版当日：

1. `package.json` → **`1.0.3`**（去掉 `-rc.*`）；`CHANGELOG` 启用 `[1.0.3]` GA 一节（草稿见 [CHANGELOG.md](../CHANGELOG.md)）。
2. Vercel：**`VITE_GA_LIVE=true`** → 欢迎页「正式版」（见 [V1.0.3_RC.md](./V1.0.3_RC.md)）。
3. 推送 / 合并后 Web 部署就绪，再打点：

```powershell
git tag v1.0.3
git push origin v1.0.3
```

4. GitHub Release：**Web + Win + Mac**；公告 + [GA_POST_LAUNCH_72H.md](./GA_POST_LAUNCH_72H.md) 值班。

---

## B. GA 之后 — 1.0.3.x 四级（稳定化）

不做功能大爆炸；按 **S1→S4** 顺序见表：

| 版本 | 主题 |
|------|------|
| **1.0.3.1** | Sentry / Cron / health 版本对齐 |
| **1.0.3.2** | 自定义域 + `APP_URL` 信任链 |
| **1.0.3.3** | 计费对账 + 法务页与套餐一致 |
| **1.0.3.4** | 发布矩阵 + live 复测入档 + 关闭 milestone |

**详表**： [ROADMAP_V1.0.3.x.md](./ROADMAP_V1.0.3.x.md)
  
**第一层可执行清单**： [V1.0.3.1_EXECUTION.md](./V1.0.3.1_EXECUTION.md)

**第二层可执行清单**： [V1.0.3.2_EXECUTION.md](./V1.0.3.2_EXECUTION.md)（可与 1.0.3.1 合并部署 → 直接发 `v1.0.3.2`）

每层发包前：`npm run go-live:preflight` + `CHANGELOG [1.0.3.N]`

---

## 命令速查

```powershell
npm run ops:verify-p1
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
```
