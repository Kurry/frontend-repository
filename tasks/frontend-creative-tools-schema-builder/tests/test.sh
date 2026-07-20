#!/usr/bin/env bash
set -u
mkdir -p /logs/verifier

# App-caused failure: write a zero reward.json (same aggregate keys as the
# tests/reward.toml [[reward]] specs) and exit 0 so harbor records the score.
# No up-front seed: rewardkit deletes pre-existing outputs at startup
# (_clear_outputs), so a seed protects nothing — infra failures exit non-zero
# with no reward.json instead.
record_zero() {
  echo "[test] $1 — recording 0.0" >&2
  echo '{"reward": 0.0, "pass": 0.0}' > /logs/verifier/reward.json
  exit 0
}

# Judge-only rewardkit harness, installed at verify time — deliberately NOT
# baked into the image, so the builder agent never has the judge harness in its
# container to inspect or tamper with (pin: tasks/_pins.py
# HARBOR_REWARDKIT_GIT_SHA; bumping regenerates test.sh copies, no image
# rebuild). Install failure is an infra error (exit 1), never a 0.0 for the app.
uv tool install "harbor-rewardkit @ git+https://github.com/Kurry/harbor@49ac88859e31cd5561f98249aaf4b9ca03c90f7e#subdirectory=packages/rewardkit" \
 && ln -sf /root/.local/bin/rewardkit /usr/local/bin/rewardkit \
 || { echo "[test] rewardkit install failed (infra)" >&2; exit 1; }

# The shared CDP Chrome is started by /opt/verifier/entrypoint.sh (Dockerfile
# HEALTHCHECK mirrors this gate). rewardkit expands $WEBMCP_CDP_* with
# os.path.expandvars, so they must be exported here.
export WEBMCP_CDP_PORT=9222
export WEBMCP_CDP_ENDPOINT="http://127.0.0.1:$WEBMCP_CDP_PORT"
for _ in $(seq 1 30); do
  curl -fsS "$WEBMCP_CDP_ENDPOINT/json/version" > /dev/null 2>&1 && break
  sleep 1
done
curl -fsS "$WEBMCP_CDP_ENDPOINT/json/version" > /dev/null 2>&1 \
  || { echo "[test] judge Chrome unreachable (infra); see /logs/verifier/chrome.log" >&2; exit 1; }

# Requires /app/package.json scripts named exactly: verify:build (exit 0), start (port 3000).
# When grading restored artifacts (harbor score), node_modules is excluded — reinstall.
if [ -f /app/package.json ] && [ ! -d /app/node_modules ]; then
  (cd /app && npm install --no-audit --no-fund) || record_zero "npm install failed — app did not build"
fi
npm run verify:build || record_zero "verify:build failed — app did not build"
# rewardkit defaults are --workspace /app --output /logs/verifier/reward.json.
exec start-server-and-test 'npm start' tcp:localhost:3000 'rewardkit /tests'
