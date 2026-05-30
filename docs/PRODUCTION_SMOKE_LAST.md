# Production smoke report

- **URL**: https://ai-ide-flame.vercel.app
- **Time**: 2026-05-30T00:44:03.167Z

- [ ] **health** — ? db=?
- [ ] **session** — HTTP 403
- [ ] **workspaces 401** — HTTP 403
- [ ] **subscription** — HTTP 403
- [ ] **index** — HTTP 403

**Result**: 0/5 passed

## Next steps

1. Fix Vercel env — [docs/VERCEL_ENV_PHASE2.md](../docs/VERCEL_ENV_PHASE2.md)
2. Redeploy
3. Re-run `npm run smoke:report`
