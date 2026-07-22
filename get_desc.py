desc = """
Drafted new evaluation task `frontend-planning-multilevel-accessible-route-lab`.

Changes:
- Added WebMCP entity and artifact bindings to `webmcp-assignments.json` and `webmcp-assignment-map.json`
- Registered task source in `webmcp-task-sources.json`
- Propagated generated `instruction.md` using `uv run python -m corpuscheck.webmcp_h3 apply`
- Generated base tests tomls via `uv run corpuscheck scaffold`
- Specialized core testing dimension tomls (core_features, visual_design, motion, technical) with relevant acceptance criteria
- Configured Vite + React reference solution (Oracle) under `solution/app` targeting port 3000
- Implemented full Dijkstra route calculation logic reflecting mobility preferences, closures, and time constraints
- Integrated topological mapping via an SVG visualization component mapped to static fictional spatial nodes
- Completed end-to-end evaluation scenario using Playwright to record Walkthrough Evidence
"""

print(desc.strip())
