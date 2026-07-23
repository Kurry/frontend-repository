# Admin Analytics Dashboard — Oracle

Reference solution (oracle) for the `frontend-data-tracking-admin-analytics-dashboard` task. Serves the app
described in `../../instruction.md`; used by `solve.sh`, the reference
screenshot capture harness, and oracle validation runs. Must serve with
zero console/page errors.

## Run

    npm install
    npm run verify:build
    npm start          # serves on port 3000

## WebMCP

Registers the task's contract modules: browse-query-v1, entity-collection-v1, artifact-transfer-v1. Tools are exposed via
window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool.
