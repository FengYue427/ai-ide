# Production smoke report

- **URL**: https://ai-ide-flame.vercel.app
- **Time**: 2026-05-22T09:05:37.602Z

- [ ] **health** — degraded db=unavailable
- [ ] **session** — HTTP 500
- [ ] **workspaces 401** — HTTP 500
- [ ] **subscription** — HTTP 500
- [x] **index** — HTTP 200

**Result**: 1/5 passed

## Next steps

1. Fix Vercel env — [docs/VERCEL_ENV_PHASE2.md](../docs/VERCEL_ENV_PHASE2.md)
2. Redeploy
3. Re-run `npm run smoke:report`
