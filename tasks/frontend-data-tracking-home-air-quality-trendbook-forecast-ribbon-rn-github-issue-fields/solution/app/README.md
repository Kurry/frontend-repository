# Home Air Quality Trendbook — Forecast Ribbon — Oracle

Reference solution (oracle) for the `frontend-data-tracking-home-air-quality-trendbook-forecast-ribbon-rn-github-issue-fields` task. Serves the app described in `../../instruction.md`; used by `solve.sh`, the reference screenshot capture harness, and oracle validation runs. Must serve with zero console/page errors.

## Run

    npm install
    npm run verify:build
    npm start

## WebMCP

Registers the task's contract modules: browse-query-v1, entity-collection-v1, artifact-transfer-v1. Tools are exposed through window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool.
