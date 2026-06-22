#!/usr/bin/env bash
set -euo pipefail
CRON=$(grep '^CRON_SECRET=' /opt/ai-ide/.env.production | sed 's/^CRON_SECRET=//' | tr -d '"')
BASE=http://47.105.110.136

cat > /etc/cron.d/ai-ide <<EOF
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

0 3 * * * root curl -fsS -X POST -H "Authorization: Bearer ${CRON}" "${BASE}/api/billing/expire-subscriptions" >> /var/log/ai-ide-cron.log 2>&1
0 4 * * * root curl -fsS -X POST -H "Authorization: Bearer ${CRON}" "${BASE}/api/jobs/process" >> /var/log/ai-ide-cron.log 2>&1
5 * * * * root curl -fsS --max-time 15 "${BASE}/api/health" | grep -q '"status":"ok"' || echo "\$(date -Is) health FAIL" >> /var/log/ai-ide-health.log
EOF

chmod 644 /etc/cron.d/ai-ide
touch /var/log/ai-ide-cron.log /var/log/ai-ide-health.log
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save
echo "✅ cron + pm2 startup done"
cat /etc/cron.d/ai-ide
