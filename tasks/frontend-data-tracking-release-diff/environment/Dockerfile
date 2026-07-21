FROM mcr.microsoft.com/playwright:v1.61.0-noble
ENV DEBIAN_FRONTEND=noninteractive

COPY --from=ghcr.io/astral-sh/uv:0.11.15 /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# Real-world agent tooling (pins: tasks/_pins.py). Browsers ship with the
# base image; the cache symlink lets tools that ignore
# PLAYWRIGHT_BROWSERS_PATH resolve them.
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g \
      playwright@1.61.0 \
      @playwright/mcp@0.0.76 \
      start-server-and-test@3.0.11 \
 && mkdir -p /root/.cache && ln -sfn /ms-playwright /root/.cache/ms-playwright

# The judge-only rewardkit harness is deliberately NOT baked in: tests/test.sh
# installs it at verify time, after the builder's turn, so the agent never has
# the judge harness in its container to inspect or tamper with (reward-hacking
# surface). Pin: tasks/_pins.py HARBOR_REWARDKIT_GIT_SHA — bumping regenerates
# test.sh copies, no image rebuild.

# WebMCP CDP bridge (same canonical source as the judge copy in
# tests/webmcp_stdio_server.mjs). Baked in so the builder can smoke-test
# its own window.webmcp_* surface: node /opt/webmcp/webmcp_stdio_server.mjs
# against the shared CDP Chrome the entrypoint starts on 127.0.0.1:9222.
COPY webmcp_stdio_server.mjs /opt/webmcp/webmcp_stdio_server.mjs

# Entrypoint starts the shared headless CDP Chrome (judge MCP servers and
# builder self-tests attach to it); HEALTHCHECK goes green only when Chrome
# answers CDP, so `harbor run --install-only` exposes a broken judge env
# before any agent trial burns 45 minutes.
COPY entrypoint.sh /opt/verifier/entrypoint.sh
RUN chmod 0755 /opt/verifier/entrypoint.sh
ENTRYPOINT ["/opt/verifier/entrypoint.sh"]
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS http://127.0.0.1:9222/json/version > /dev/null || exit 1

WORKDIR /app
EXPOSE 3000

# Reference screenshots for the builder (never shipped in /app)
COPY reference-screenshots/ /reference-screenshots/
