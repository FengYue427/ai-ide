# 当前执行清单

> **1.0.3.x 四级**：**1.0.3.4 已发** ✅ · 下一世代 **[v1.1 RFC](V1.1_RFC_STUB.md)**  
> [ROADMAP_V1.0.3.x.md](./ROADMAP_V1.0.3.x.md) · [V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md)（主版本 GA 仍可选）

---

## A. 1.0.3.x 收官快照（2026-05-27）

| 版本 | 状态 | 清单 |
|------|:----:|------|
| 1.0.3.1+1.0.3.2 | ✅ `v1.0.3.2` | [V1.0.3.2_EXECUTION.md](./V1.0.3.2_EXECUTION.md) |
| 1.0.3.3+1.0.3.4 | ✅ `v1.0.3.4` | [V1.0.3.3](./V1.0.3.3_EXECUTION.md) · [V1.0.3.4](./V1.0.3.4_EXECUTION.md) |

- [x] `package.json` → **1.0.3.4** · tag **`v1.0.3.4`** 已推送
- [ ] Vercel 部署后 `npm run rc:live-spotcheck` → `version=1.0.3.4`
- [ ] 人工 5 项勾选 → [RC_LIVE_SPOTCHECK_LAST.md](./RC_LIVE_SPOTCHECK_LAST.md)
- [ ] 周度对账 1 轮 → [BILLING_RECONCILE_DAILY.md](./BILLING_RECONCILE_DAILY.md)
- [ ] 发布矩阵 ≥2 渠道（CSDN/掘金等）→ [publish/README.md](./publish/README.md)
- [ ] GitHub 关闭 **1.0.3.x** milestone · 开 v1.1 Discussion

---

## B. 仍可选 — 主版本 v1.0.3 GA

若需对外「稳定版」叙事（非 1.0.3.x 补丁号）：

1. `package.json` → `1.0.3` · `VITE_GA_LIVE=true`
2. `git tag v1.0.3 && git push origin v1.0.3`
3. GitHub Release Web + Win + Mac

见 [V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md) Phase 3。

---

## C. 下一世代 v1.1

- 占位：[V1.1_RFC_STUB.md](./V1.1_RFC_STUB.md)
- 候选：后台 Agent 队列 · 协作 M1 · AI 网关 · i18n Phase 2

---

## 命令速查

```powershell
npm run ops:verify-p1
npm run test:local
npm run go-live:preflight
npm run rc:live-spotcheck
npm run billing:verify-cron
```
