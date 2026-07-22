<summary>
Build the Quilt Seam Topology Studio using React, Tailwind CSS 4.3.2, and Lucide React. The app is a framework-agnostic synthesis of adaptive grids, workflow canvas, resource planning, branch comparison, task state, and review primitives. It must produce the operator's exact fabrication artifacts: a downloadable JSON project schema, a CSV piece manifest, a deterministic SVG nested template group, an assembly DAG JSON, and Markdown maker notes.
</summary>

<core_features>
Feature: Block and piece geometry —
- Create, clone, rotate, mirror, translate, and parameterize polygon pieces on an exact grid.
- Finished geometry and cut geometry are separate; seam allowance offsets include corner joins and notches.
- Keyboard transform controls and mobile numeric sheets are strictly equivalent to pointer edits.
Feature: Seam topology graph —
- Join directed edges only when finished lengths, orientation, seam family, and easing tolerance rules permit.
- Each join has a stable identity and exposes piece-edge endpoints.
- Selecting a join highlights both block geometry and its assembly dependency.
Feature: Fabric mapping and lot conservation —
- Assign piece instances to fabric lots with grain/rotation rules, usable dimensions, reserved/consumed/scrapped areas, and substitute mappings.
- Exact area uses fixture formulas. Zero remaining differs from unknown; event quantities never rewrite earlier consumption.
Feature: Template nesting —
- Arrange cut polygons within lot sheets, including margins and grain axes.
- Overlap/out-of-bounds/rotation violations remain preview-only.
- Compare candidate nests by used area, waste, piece coverage, and lot fragmentation without changing canonical assignments until accepted.
Feature: Assembly DAG and partial piecing —
- Derive or edit assembly groups from seam joins; cycles are forbidden.
- Schedule groups into ordered steps, then advance the clock and record join-completed, seam-opened, unpicked, rematched, scrapped, or replaced events.
- A partial block preserves actual joins while replanning unfinished work.
Feature: Variant branches and proof —
- Fork geometry, fabric, topology, nesting, or assembly choices; compare ghosted shapes and exact material/dependency deltas; merge per piece/join.
- Proof freezes a revision and derived templates. Later changes mark proof/artifacts stale; reproof appends a revision.
Feature: Responsive studio and artifacts —
- Desktop links block canvas, topology graph, lot/nesting view, assembly DAG, and issue queue. Tablet uses paired panes. Mobile uses block strip, focused piece editor, seam-pair sheet, lot cards, nesting viewport, and assembly stepper with complete actions.
</core_features>

<visual_design>
- Inspect finished/cut, selected/joined/mismatch, grain/lot/overlap, planned/completed/unpicked, branch/stale/proof states -> distinctions remain legible.
</visual_design>

<motion>
- Transform/snap/detach, assign/nest, reorder assembly, complete/unpick, compare/merge, proof/stale, then repeat reduced -> causal endpoints and values agree.
- Causal motion: Edges snap with visible orientation; topology and assembly paths reroute; branch ghosts and stale proof show provenance. Reduced motion preserves geometry and values.
</motion>

<requirements>
- Shared application state must use in-memory state only (e.g., React Context or Zustand). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- All assets must be loaded locally without CDNs.
- Stack: React, Tailwind CSS 4.3.2, and Lucide React.
- Deterministic fixture on fresh load: An abstract 48-block project contains 14 block types, 286 polygon piece instances, 19 seam families, eight fictional fabric lots, four grain directions, 31 assembly groups, two variants, three seeded mismatches, one exhausted lot event, and a logical assembly clock. Units are exact integer eighth-inches.
- Artifact contract:
  - quilt-project.json: schema/version, fixture hash, units, pieces/transforms, seams, allowances, blocks, lots/allocations, nests, assembly DAG, branches, events, proofs, and lineage.
  - piece-manifest.csv: one row per piece instance with block, transform, finished/cut bounds, allowance, fabric lot, grain, nest sheet, and state.
  - templates.svg: deterministic grouped cut geometry with ids, notches, grain arrows, labels, margins, and accessible descriptions.
  - assembly-plan.json: groups, seam joins, dependencies, order, completed/unpicked state, proof revision, and content hashes.
  - maker-notes.md: dimensions, material totals, unresolved/waived issues, variant choices, partial-work recovery, and provenance.
- Export is deterministic except regenerated exportedAt; reset/import recreates canonical state and equivalent files. Imports reject malformed data.
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
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
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
- Editor object types: piece; seam; nest
- Editor properties: transform; orientation
- Editor operations: select; update_property; switch_mode; preview; set_content
- Editor modes: geometry; fabric; topology; assembly; proof
- Entity: quilt-entity
- Entity operations: create; select; update; delete; toggle
- Entity fields: entity-type; dimensions; material; order; revision
- Artifact operations: export; import; copy
- Export formats: quilt-project-json; piece-manifest-csv; templates-svg; assembly-plan-json; maker-notes-md
- Import modes: quilt-project-json

Mechanics exclusions:
- Canvas selection, panning, zooming, dragging, snapping, and keyboard movement stay Playwright-observed
- Hover previews and export-menu reveal mechanics stay Playwright-observed
- Native download, file-picker import, and clipboard contents stay Playwright-observed; WebMCP returns no artifact contents

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
