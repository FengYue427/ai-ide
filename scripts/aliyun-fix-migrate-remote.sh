#!/usr/bin/env bash
set -euo pipefail
cd /opt/ai-ide

sed -i '/CREATE SCHEMA IF NOT EXISTS "public";/d' prisma/migrations/20260520120000_init/migration.sql

PGPASSWORD="${RDS_PASSWORD:?}" psql -h pgm-m5e8bcodgw2q51d6.pg.rds.aliyuncs.com -U ai_ide -d ai_ide \
  -c "DELETE FROM _prisma_migrations WHERE migration_name = '20260520120000_init';"

export NODE_ENV=production
export AI_IDE_ENV_FILE=/opt/ai-ide/.env.production

npm run db:migrate:deploy
npm run db:seed

pm2 startOrReload deploy/aliyun/ecosystem.config.cjs
pm2 save
pm2 status
