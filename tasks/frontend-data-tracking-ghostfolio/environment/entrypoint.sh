#!/usr/bin/env bash
# Container entrypoint (baked by environment/Dockerfile as /opt/verifier/entrypoint.sh).
# Starts the shared headless CDP Chrome that the judge's MCP servers (contract in
# corpuscheck canonical/mcp/reward_mcp_servers.toml) and builder self-tests attach to,
# then execs the container command. Paired with the Dockerfile HEALTHCHECK so
# `harbor run --install-only` exposes a broken judge env before any agent trial.
set -u
mkdir -p /logs/verifier
WEBMCP_CDP_PORT="${WEBMCP_CDP_PORT:-9222}"
WEBMCP_RM_CDP_PORT="${WEBMCP_RM_CDP_PORT:-9223}"

# Image chromium only (codec-limited: VP9 yes, h264 no — task videos need a
# .webm source); resolved deterministically via the global playwright install.
PW_ROOT="$(npm root -g)"
CHROME_BIN="$(node -e "console.log(require('$PW_ROOT/playwright').chromium.executablePath())")" \
  || echo "[entrypoint] cannot resolve chromium path; healthcheck will stay red" >&2
if [ -n "${CHROME_BIN:-}" ]; then
  # blink-settings force (hover: hover)/(pointer: fine): headless Linux has no
  # pointing device, which would strip every Tailwind v4 hover: style.
  "$CHROME_BIN" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 \
    --remote-debugging-address=127.0.0.1 --remote-debugging-port="$WEBMCP_CDP_PORT" \
    --user-data-dir=/tmp/webmcp-chrome-profile about:blank \
    > /logs/verifier/chrome.log 2>&1 &
  # Second Chrome with prefers-reduced-motion forced: the primary browser cannot
  # emulate the media query, so reduced-motion criteria are graded on this one
  # (judge MCP server playwright_reduced_motion). Same blink-settings so hover/
  # pointer capabilities match the primary browser.
  "$CHROME_BIN" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-prefers-reduced-motion \
    --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 \
    --remote-debugging-address=127.0.0.1 --remote-debugging-port="$WEBMCP_RM_CDP_PORT" \
    --user-data-dir=/tmp/webmcp-chrome-rm-profile about:blank \
    > /logs/verifier/chrome-rm.log 2>&1 &
fi

if [ "$#" -eq 0 ]; then
  exec sleep infinity
fi
exec "$@"
