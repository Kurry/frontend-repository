npm install -g @codex-agent/cli
cd tasks/frontend-workflow-daisyui-admin-dashboard/
WEBMCP_CDP_PORT=9222 WEBMCP_CDP_ENDPOINT="http://127.0.0.1:9222" WEBMCP_RM_CDP_PORT=9223 WEBMCP_RM_CDP_ENDPOINT="http://127.0.0.1:9223" rewardkit --workspace solution/app --output solution/reward.json tests/accessibility
