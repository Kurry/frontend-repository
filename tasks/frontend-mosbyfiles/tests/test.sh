#!/usr/bin/env bash
set -u
mkdir -p /logs/verifier
echo '{"reward": 0.0}' > /logs/verifier/reward.json

# Test-only deps (pins: tasks/_pins.py). Not baked into the image.
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g \
  start-server-and-test@3.0.11 \
  playwright@1.61.0
npx -y @playwright/mcp@0.0.76 install-browser chrome-for-testing
mkdir -p /root/.cache && ln -sfn /ms-playwright /root/.cache/ms-playwright
npx -y playwright@1.61.0 install chromium
uv tool install "harbor-rewardkit @ git+https://github.com/Kurry/harbor@49ac88859e31cd5561f98249aaf4b9ca03c90f7e#subdirectory=packages/rewardkit" \
 && ln -sf /root/.local/bin/rewardkit /usr/local/bin/rewardkit

# Shared headless Chrome for the judge's MCP servers (contract in
# scripts/canonical/mcp/reward_mcp_servers.toml): Playwright MCP and the
# webmcp bridge (tests/webmcp_stdio_server.mjs) both attach via $WEBMCP_CDP_ENDPOINT. rewardkit
# expands these with os.path.expandvars, so they must be exported here.
WEBMCP_CDP_PORT=9222
CHROME_BIN="$(find /ms-playwright -type f \( -name chrome -o -name chromium \) -not -path '*headless*' 2>/dev/null | head -n1)"
if [ -n "$CHROME_BIN" ]; then
  # blink-settings force (hover: hover)/(pointer: fine): headless Linux has no
  # pointing device, which would strip every Tailwind v4 hover: style.
  "$CHROME_BIN" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 \
    --remote-debugging-address=127.0.0.1 --remote-debugging-port="$WEBMCP_CDP_PORT" \
    --user-data-dir=/tmp/webmcp-chrome-profile about:blank \
    > /logs/verifier/chrome.log 2>&1 &
  for _ in $(seq 1 60); do
    curl -fsS "http://127.0.0.1:$WEBMCP_CDP_PORT/json/version" > /dev/null 2>&1 && break
    sleep 1
  done
else
  echo "[test] no Chrome binary found under /ms-playwright; judge browser will fail" >&2
fi
export WEBMCP_CDP_PORT
export WEBMCP_CDP_ENDPOINT="http://127.0.0.1:$WEBMCP_CDP_PORT"

# Requires /app/package.json scripts named exactly: verify:build (exit 0), start (port 3000).
# When grading restored artifacts (harbor score), node_modules is excluded — reinstall.
if [ -f /app/package.json ] && [ ! -d /app/node_modules ]; then
  (cd /app && npm install --no-audit --no-fund) \
    || { echo "[test] npm install failed; leaving safety reward" >&2; exit 0; }
fi
npm run verify:build || { echo "[test] build failed; leaving safety reward" >&2; exit 0; }
exec start-server-and-test 'npm start' tcp:localhost:3000 \
  'rewardkit /tests --workspace /app --output /logs/verifier/reward.json'
