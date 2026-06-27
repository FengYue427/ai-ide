#!/usr/bin/env bash
set -euo pipefail

BLOCK='    location /downloads/ {
        alias /opt/ai-ide/dist/downloads/;
        default_type application/octet-stream;
        add_header Content-Disposition "attachment" always;
    }'

for f in /etc/nginx/conf.d/ai-ide.conf /etc/nginx/conf.d/ai-ide-ssl.conf; do
  [ -f "$f" ] || continue
  if grep -q 'location /downloads/' "$f"; then
    echo "skip $f (already patched)"
    continue
  fi
  awk -v block="$BLOCK" '
    /location \/website\// {
      print
      print block
      next
    }
    { print }
  ' "$f" > "${f}.tmp"
  mv "${f}.tmp" "$f"
  echo "patched $f"
done

nginx -t
systemctl reload nginx
echo "nginx reloaded"
