#!/usr/bin/env bash
# 首次 ECS 初始化（Ubuntu 22.04）— 在服务器上以 root/sudo 运行一次
set -euo pipefail

echo "=== AI IDE ECS bootstrap ==="

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx git curl ca-certificates

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

mkdir -p /opt/ai-ide
chown -R "${SUDO_USER:-$USER}:$USER" /opt/ai-ide 2>/dev/null || true

echo ""
echo "✅ Node $(node -v) · npm $(npm -v) · pm2 $(pm2 -v)"
echo "   部署目录: /opt/ai-ide"
echo "   下一步（开发机）:"
echo "     cp .env.aliyun.example .env.aliyun"
echo "     npm run aliyun:deploy -- --with-env"
