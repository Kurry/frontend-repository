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
uv tool install "harbor-rewardkit @ git+https://github.com/Kurry/harbor@c00ee52302debcdcff1869135abd4b67ac2cb0f4#subdirectory=packages/rewardkit" \
 && ln -sf /root/.local/bin/rewardkit /usr/local/bin/rewardkit

npm run verify:build || { echo "[test] build failed; leaving safety reward" >&2; exit 0; }
exec start-server-and-test 'npm start' tcp:localhost:3000 \
  'rewardkit /tests --workspace /app --output /logs/verifier/reward.json'
