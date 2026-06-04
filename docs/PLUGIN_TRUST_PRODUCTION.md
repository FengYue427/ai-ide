# Plugin trust market — production rollout (v1.2.8)

## Server (Vercel / API)

1. Apply schema: `npx prisma migrate deploy` (includes `PluginPublishReview`).
2. Set env (see [VERCEL_V1.2_PRODUCTION_ENV.md](./VERCEL_V1.2_PRODUCTION_ENV.md)):
   - `DATABASE_URL` — required for durable publish queue
   - `PLUGIN_PUBLISH_ENABLED=true` — enables `POST /api/plugins/publish`
   - `PLUGIN_OFFICIAL_SIGNING_KEY` — optional; health reports `officialKeyConfigured`
3. Redeploy API; verify `GET /api/health` → `plugins.publishEnabled: true`.
4. Run `npm run test:integration:local` — expects publish 202, reviews list, and DB row when `DATABASE_URL` is set.

## Client (static / desktop)

1. Enable trust UI when ready: `VITE_PLUGIN_TRUST_MARKET=true` (see [V1.2.6_F3_PROD_FLAGS.md](./V1.2.6_F3_PROD_FLAGS.md)).
2. Users submit from **Plugins → Manual install** → **Submit for review** (`data-testid="plugin-publish-form"`).
3. **Settings → Plugin ops** lists recent reviews (`GET /api/plugins/publish/reviews`); cold start without DB still shows in-memory rows until restart.

## Operations

- Reviews stay `pending` until manual merge into the official catalog (no auto-publish).
- Rate limit: `plugins:publish` (10 / 6 min per user).
- Logs: `[PluginPublish] queued for manual review` with `reviewId`, `manifestHash`.

## Rollback

- Set `PLUGIN_PUBLISH_ENABLED=false` — POST returns 503; GET reviews returns `publishEnabled: false`.
- DB table can remain; no client flag change required.
