# Symbolic Rubric Difficulty Profiler

<summary>
Symbolic Rubric Difficulty Profiler helps an evaluation methodology lead import a source-hashed cohort manifest and completed job artifacts, enforce task-revision and rubric-hash compatibility, compute criterion difficulty and blocked rates under an explicit eligibility policy, brush distributions to inspect contributing jobs, compare model/dimension/cohort-policy sensitivities, resolve warnings, and publish a versioned profile with JSON and CSV. The useful end state is a reproducible empirical profile in which every rank, denominator, missing/blocked exclusion, sensitivity delta, drilldown job, source hash, warning decision, and exported row agrees. Input consists of cohort-manifest.json plus each jobs result.json, evaluation/reward.json, and evaluation/reward-details.json; optional ATIF metadata may supply agent/model identity but no trajectory evidence is analyzed. Criterion-level ranking requires one task revision/checksum and one rubric hash. Cross-task or mixed-rubric jobs may appear only in a dimension-level compatibility summary and are excluded from criterion statistics. One profile supports 100 jobs, 16 dimensions, 800 criteria, 8 models, and 12 saved cohort-policy views.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
1. Import valid cohort: When providing a valid ZIP archive containing cohort-manifest.json and declared job subdirectories, the app must parse it and present an ingest checklist. Manifest, jobs, and source hashes must agree with the ingested state.
2. Validate compatibility: The user must be able to group jobs by task ID/checksum and rubric hash. An exact primary task/rubric group must be selectable, and excluded reasons must appear for incompatible jobs.
3. Compute profile: Criterion counts, difficulty, ranks, and blocked rates must match the standard formula (1 - mean(value)) and the active policy. Missing/blocked observations are excluded from the primary difficulty calculation.
4. Brush and drill down: The user must be able to set a numeric range on a criterion distribution chart (by brushing or numeric input). The rank ribbon, criterion table, distribution shape, model breakdown, and list of contributing jobs must update to reflect this filtered selection.
5. Switch sensitivity/policy: The user must be able to switch between the primary difficulty profile and a blocked-as-fail sensitivity mode. The primary profile must remain visible, and versioned deltas (rank shifts, provenance) must update appropriately.
6. Resolve warnings and approve: The user must be able to resolve non-blocking warnings, address blocking warnings, and grant approval. A final matching JSON and CSV export must be produced containing the exact immutable state.
</core_features>

<user_flows>
</user_flows>

<edge_cases>
</edge_cases>

<visual_design>
1. View desktop: At wide breakpoints (>=1280px), the application must display a "statistical light-table" hierarchy: a left rail (cohort identity, compatibility, policy), a center stack (rank ribbon, distributions, criterion table), and a right inspector (contributing jobs, values, AI explanation, publication state).
2. Inspect primary/blocked/missing/sensitivity/incompatible: Data visualization elements must use redundant marker shapes, line styles, patterns, and labels (alongside colors like indigo for primary, amber for blocked, violet for sensitivity) to distinguish states.
3. Read dense statistics/jobs: Typography must use compact sans-serif for UI text, and tabular/monospace for values, counts, hashes, and formulas to remain legible.
</visual_design>

<motion>
1. Apply descriptive filter/brush: Modifying a descriptive filter or brush range must transition points and ranks over 180-240 ms while keeping the selected criterion anchored in view.
2. Enable sensitivity: When switching to sensitivity mode, dashed positions and connectors must draw the rank delta without replacing the primary canonical position.
3. Reduced motion: When the system prefers reduced motion, transitions must snap instantly, and a persistent summary (e.g., "7 criteria moved >=5 ranks; primary profile unchanged") must replace the animation.
</motion>

<responsiveness>
</responsiveness>

<accessibility>
</accessibility>

<performance>
</performance>

<writing>
</writing>

<innovation>
</innovation>

<requirements>
The application must only communicate with http://127.0.0.1:4317/profiles/Symbolic-rubric-difficulty-profiler for its data layer (supplied by infrastructure issue 2179). Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies. Tailwind CSS 4.3.2 must be used for styling.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- artifact-transfer-v1
- browse-query-v1
- entity-collection-v1
- structured-editor-v1

Module specs:
<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

Bindings:
- Entity: cohort-profile
- Entity operations: create; select; update; delete

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
