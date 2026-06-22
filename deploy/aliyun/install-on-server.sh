#!/usr/bin/env bash
# 在 ECS 上执行（npm run aliyun:remote-install 会 SSH 调用）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== AI IDE install-on-server @ $ROOT ==="

if [[ ! -f .env.production ]]; then
  echo "❌ 缺少 .env.production — 从 deploy/aliyun/env.production.example 复制并填写"
  exit 1
fi

export NODE_ENV=production
export AI_IDE_ENV_FILE="$ROOT/.env.production"

echo "--- static dist ---"
if [[ -d dist-aliyun ]]; then
  rm -rf dist
  mv dist-aliyun dist
  echo "Promoted dist-aliyun -> dist"
fi

if [[ ! -f dist/index.html ]]; then
  echo "❌ dist/index.html missing after build sync"
  exit 1
fi

echo "--- npm ci ---"
npm ci

echo "--- tsx (API runtime) ---"
npm install tsx@^4.22.0 --no-save --no-package-lock --omit=optional
if [[ ! -f node_modules/.bin/tsx ]]; then
  echo "❌ tsx 未安装 — API 无法启动"
  exit 1
fi
chmod +x node_modules/.bin/tsx

echo "--- prisma generate ---"
npx prisma generate

echo "--- db migrate deploy ---"
npm run db:migrate:deploy

if [[ "${AI_IDE_RUN_SEED:-}" == "1" ]]; then
  echo "--- db seed (first install) ---"
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.production"
  set +a
  npm run db:seed
fi

echo "--- pm2 ---"
if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload deploy/aliyun/ecosystem.config.cjs
  pm2 save
  pm2 status
else
  echo "⚠️  pm2 未安装 — sudo npm i -g pm2"
  echo "   或手动: npm run start:api:production"
  exit 1
fi

echo ""
echo "✅ 服务器安装完成"
echo "   配置 Nginx: deploy/aliyun/nginx.conf.example"
echo "   Cron: deploy/aliyun/crontab.example"
