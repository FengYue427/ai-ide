#!/usr/bin/env bash
# 备案域名 DNS A 记录生效后，在 ECS 上执行：
#   sudo bash /opt/ai-ide/deploy/aliyun/setup-ssl-certbot.sh
set -euo pipefail

DOMAIN="xn--um0a26fb1j.com"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

echo "=== 检查 DNS ==="
IP=$(dig +short "$DOMAIN" A @223.5.5.5 | head -1)
if [[ -z "$IP" ]]; then
  echo "❌ $DOMAIN 尚无 A 记录，请先在阿里云 DNS 添加 A → ECS 公网 IP"
  exit 1
fi
echo "✅ $DOMAIN → $IP"

apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

mkdir -p /var/www/certbot

echo "=== 申请 Let's Encrypt 证书 ==="
certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --non-interactive

SSL_CONF="/etc/nginx/conf.d/ai-ide-ssl.conf"
cat > "$SSL_CONF" <<EOF
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 许红花.com ${DOMAIN} www.许红花.com www.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    root /opt/ai-ide/dist;
    index index.html;

    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        proxy_pass http://ai_ide_api;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location /signup { try_files /signup.html =404; }
    location /login { try_files /login.html =404; }
    location /website/ { try_files \$uri \$uri/ =404; }
    location / { try_files \$uri \$uri/ /index.html; }
}
EOF

# HTTP 域名 server 加 301 跳转（保留 acme-challenge）
sed -i '/server_name 许红花.com/,/^}/ {
  /location \/ {/i\
    location / {\
        return 301 https://$host$request_uri;\
    }
' /etc/nginx/conf.d/ai-ide.conf 2>/dev/null || true

# 启用 SSL include
grep -q 'ai-ide-ssl.conf' /etc/nginx/conf.d/ai-ide.conf || \
  echo 'include /etc/nginx/conf.d/ai-ide-ssl.conf;' >> /etc/nginx/conf.d/ai-ide.conf

nginx -t && systemctl reload nginx
echo "✅ HTTPS 已启用 — 打开 https://许红花.com/api/health 验收"
