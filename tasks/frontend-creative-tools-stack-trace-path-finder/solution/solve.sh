#!/usr/bin/env bash
set -euo pipefail
shopt -s dotglob nullglob
for path in /app/* /app/.[!.]* /app/..?*; do
  rm -rf -- "$path"
done
cp -a /solution/app/. /app/
if [[ ! -f /app/package.json ]]; then
  cat > /app/package.json <<'EOF'
{
  "name": "oracle-static",
  "private": true,
  "scripts": {
    "verify:build": "node -e \"require('fs').accessSync(require('fs').existsSync('Dashboard.html')?'Dashboard.html':'index.html')\"",
    "start": "npx --yes serve -l 3000 -n"
  }
}
EOF
fi
if [[ -f /app/Dashboard.html && ! -f /app/index.html ]]; then
  printf '%s\n' '<!DOCTYPE html><meta http-equiv="refresh" content="0; url=Dashboard.html">' > /app/index.html
fi
