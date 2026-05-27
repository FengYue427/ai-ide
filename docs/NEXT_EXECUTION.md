# 当前执行清单

> **Phase 1 运维封板**：进行中 🔶  
> [V1.0.3_PHASE1_OPS.md](./V1.0.3_PHASE1_OPS.md) · [V1.0.3_KICKOFF.md](./V1.0.3_KICKOFF.md)

---

## 1.0.3 Phase 1（本周）

```powershell
npm run ops:verify-p1
```

**待 Vercel 人工**：

- [ ] `VITE_SENTRY_DSN` → release `ai-ide@1.0.3`
- [ ] `CRON_SECRET` → `npm run billing:verify-cron`
- [ ] [V1.0.3_VERCEL_ENV.md](./V1.0.3_VERCEL_ENV.md) 逐项勾选

---

## 下一：Phase 2 RC

- `1.0.3-rc.1` · CHANGELOG · live 抽测 5 项

---

## 命令

```powershell
npm run ops:verify-p1
npm run test:local
npm run go-live:preflight
```
