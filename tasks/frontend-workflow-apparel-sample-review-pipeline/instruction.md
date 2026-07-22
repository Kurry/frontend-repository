# Apparel Sample Review Pipeline

<summary>
The user authors measurement and construction callouts on a fixed garment diagram, binds material/color lots, receives sample snapshots, records measured values and region issues, routes revisions, compares samples, resolves tolerance and material conflicts, approves a production-ready version, handles partial deliverable failure, and exports an exact tech pack and sample history.

This is a browser-based application with in-memory state only (NO localStorage or backend).
</summary>

<core_features>
- Diagram callout editor: Measurement points/lines and construction regions drag on normalized front/back coordinates. Callouts bind type, label, method, seam/edge anchors, leader line, and note. Geometry must stay within panel/allowed anchor zones and avoid label collisions under fixed layout rules. Keyboard coordinates and mobile callout sheets equal pointer gestures.
- Measurement schema and calculation: Each point defines base-size target millimeters, +/- tolerance, adjacent size rule, measurement method, and dependency. The table and diagram share selection. Editing a base or rule recalculates all size targets; circular dependencies and invalid bounds reject. Values use integer tenths of millimeters.
- Material and colorway bindings: Panels/callouts bind shell, lining, interfacing, thread, button, and label lots with colorway, width, shrink fixture, consumption, and approved substitution rules. Changing material propagates adjusted target fixtures/usage and marks samples/approvals stale. Lot quantities reserve per sample and conserve integer square centimeters/units.
- Sample snapshots and measurement review: Each received sample freezes spec revision, size/colorway, material lots, diagram/checksum, measured values, evidence regions, and receipt time. Users enter/accept fixture measurements, classify pass/high/low/not-measured, and annotate construction/color/material issues. Snapshots are immutable; corrections append an erratum.
- Issue and revision workflow: Issues move open to clarified to assigned to revision-proposed to accepted/rejected to implemented-in-spec to verified-in-sample to closed. Each binds exact sample, measurement/callout/material/region, severity, owner, expected correction, and evidence. Implementing accepted issues creates a spec revision branch and marks dependent sample conclusions stale.
- Compare and tolerance lenses: Two sample/spec revisions compare diagram positions, target/actual values, deltas, tolerance bands, callout text, materials, issues, and sizes. Heatmaps show deviations by measurement/size/sample; selecting a cell highlights diagram, evidence, revision event, and tech-pack row. Missing and zero remain distinct.
- Approval and partial package recovery: Approval gates are measurement, construction, material/color, calculation parity, issue closure, and package parity. Each freezes component checksums. Packaging generates SVG diagrams, measurement CSV, material bill, issue/sample history, and Markdown instructions. First package run deterministically fails one colorway diagram and one checksum; retry failed-only preserves successes.
- Responsive pipeline and artifacts: Desktop shows diagram, spec/material tables, sample compare, and issue/approval rail. Mobile becomes garment mini-map, callout/measurement/material cards, vertical revision/issue lineage, sample delta drilldowns, and package stepper. Export produces canonical JSON, SVG annotated diagrams, CSV measurements/materials/sample history, and Markdown tech pack/changelog; import reconstructs state exactly.
</core_features>

<visual_design>
- The application provides a legible hierarchy across callout anchors, targets, tolerance, sample states, issues, approvals, and packages.
- Distinctions between missing and zero values, pass/high/low classifications, and reserved material states are visually distinct.
</visual_design>

<motion>
- Callout movement, propagation, material/sample stale state, issue-to-revision transition, comparison, and package retry explain cause through animation.
- Reduced motion retains before/after values, regions, and status without animation.
</motion>

<requirements>
- Initial load shows immutable garment/spec/material/sample fixtures with no user edit, review decision, issue event, spec revision, approval, package attempt, annotation, or export.
- Forms cannot be substituted for spatial actions where geometry is required.
- Provide a downloadable artifact with standard JSON structure, SVGs, CSVs, and Markdown.
- Tailwind CSS 4.3.2 is required.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- entity-collection-v1
- structured-editor-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

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

Bindings:
- Entity: apparel-review-record
- Entity operations: create; select; update; toggle
- Entity fields: record-type; label; status; severity; owner; measurement; material-lot; reason; evidence
- Editor object types: callout; measurement-point; construction-region; material-binding; sample-erratum; issue-revision
- Editor operations: select; add; update_property; set_content; switch_mode; preview
- Editor properties: x; y; type; label; method; anchor; note; base-target; tolerance; size-rule; material-id; measured-value; status
- Editor modes: diagram; measurements; materials; samples; issues; compare; approvals; package
- Session operations: start; restart; advance; trigger_demo
- Demos: package-run; retry-failed-package; comparison-lens; approval-check
- Artifact operations: export; import; copy
- Export formats: canonical-json; annotated-svg; measurements-csv; materials-csv; sample-history-csv; tech-pack-markdown; changelog-markdown
- Import modes: canonical-json
- Value bounds: callout normalized x and y each 0-100 and constrained to declared garment anchor zones; measurements use integer tenths of millimeters with non-negative tolerances and acyclic dependencies; material reservations conserve non-negative integer square centimeters or units per lot; issue status follows the declared lifecycle without skipping required states; sample snapshots are immutable and corrections append errata
- Workflow completion: moving or editing a callout updates the shared diagram/table selection and recalculates dependent size targets while invalid bounds or cycles leave state unchanged with field errors
- Workflow completion: changing a material binding adjusts derived targets and reservations and marks dependent samples and approvals stale
- Workflow completion: recording a sample measurement classifies pass, high, low, or not-measured against the frozen revision while corrections append an erratum
- Workflow completion: accepting and implementing an issue creates a revision branch and marks dependent conclusions stale
- Workflow completion: selecting a compare or heatmap cell highlights its diagram, evidence, revision, and tech-pack row while zero remains distinct from missing
- Workflow completion: the first package run preserves successful outputs while failing one colorway diagram and one checksum; retry-failed changes only those failed outputs
- Workflow completion: canonical import reconstructs the visible diagram, specifications, materials, samples, issues, revisions, approvals, and package history

Mechanics exclusions:
- Callout and evidence-region dragging, diagram/heatmap selection, keyboard coordinate editing, mobile cards and drilldowns, and responsive navigation are driven with Playwright; equivalent bounded state uses editor/entity tools
- Visual stale markers, tolerance bands, leader lines, collision avoidance, focus indicators, hover states, and transitions remain Playwright-observed
- File downloads, native file selection, and clipboard contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
